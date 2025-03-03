import asyncio
import signal
import warnings
from src.log import get_logger, setup_logging

setup_logging()
from src.api.service import ApiService
from src.rag_service.service import RAGService

logger = get_logger("main")

# Store services globally so they can be accessed by shutdown handler
services = {}


async def shutdown(signal, loop):
    """Cleanup tasks tied to the service's shutdown."""
    # Mark shutdown as in progress to prevent recursion
    loop.__dict__["shutdown_in_progress"] = True

    logger.info(f"Received exit signal {signal.name}")

    # First stop the services - this should handle their internal cleanup
    if "api_service" in services:
        logger.info("Stopping API service...")
        try:
            await services["api_service"].stop()
        except asyncio.CancelledError:
            logger.info("API service stop was cancelled, continuing shutdown")
        except Exception as e:
            logger.error(f"Error stopping API service: {e}")

    if "rag_service" in services:
        logger.info("Stopping RAG service...")
        try:
            await services["rag_service"].stop()
        except asyncio.CancelledError:
            logger.info("RAG service stop was cancelled, continuing shutdown")
        except Exception as e:
            logger.error(f"Error stopping RAG service: {e}")

    # Get all running tasks
    pending_tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    logger.info(f"Cleaning up {len(pending_tasks)} tasks")

    # Cancel all tasks
    for task in pending_tasks:
        try:
            task.cancel()
        except Exception:
            pass

    # Use wait instead of gather for better task handling
    if pending_tasks:
        logger.info("Waiting for tasks to complete...")
        try:
            # Wait with a short timeout
            done, pending = await asyncio.wait(
                pending_tasks, timeout=1.0, return_when=asyncio.ALL_COMPLETED
            )

            logger.info(f"Completed: {len(done)}, Still pending: {len(pending)}")

            # For any remaining tasks, detach them to prevent "was destroyed but is pending" warnings
            for task in pending:
                # This prevents the "Task was destroyed but it is pending!" warnings
                # We're explicitly acknowledging we're abandoning these tasks
                task._log_destroy_pending = False

        except Exception as e:
            logger.error(f"Error during task cleanup: {e}")

    # Schedule the loop to stop
    loop.call_later(0.2, _stop_loop, loop)
    logger.info("Shutdown initiated. Exiting in 0.2 seconds.")


def _stop_loop(loop):
    """Helper function to stop the loop after a delay"""
    try:
        if loop.is_running():
            loop.stop()
    except Exception as e:
        logger.error(f"Error stopping loop: {e}")


def handle_exception(loop, context):
    """Handle exceptions outside of coroutines"""
    # Filter out task destroyed warnings during shutdown
    if "Task was destroyed but it is pending" in str(context.get("message", "")):
        if loop.__dict__.get("shutdown_in_progress", False):
            # These are expected during shutdown, don't log as errors
            return

    msg = context.get("exception", context["message"])
    logger.error(f"Caught exception: {msg}")

    # Prevent infinite recursion
    if not loop.__dict__.get("shutdown_in_progress", False):
        logger.info("Shutting down...")
        loop.__dict__["shutdown_in_progress"] = True
        asyncio.create_task(shutdown(signal.SIGTERM, loop))
    else:
        logger.warning("Shutdown already in progress, ignoring additional exceptions")


async def main():
    # Ignore asyncio warnings about pending tasks during shutdown
    warnings.filterwarnings("ignore", message="coroutine .* was never awaited")

    # Get the current event loop
    loop = asyncio.get_running_loop()

    # Initialize shutdown tracking flag
    loop.__dict__["shutdown_in_progress"] = False

    # Add signal handlers
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(
            sig, lambda s=sig: asyncio.create_task(shutdown(s, loop))
        )

    # Set up exception handler
    loop.set_exception_handler(handle_exception)

    try:
        # Initialize services
        rag_service = RAGService()
        await rag_service.init()
        await rag_service.set_rag_llm("openai", "gpt-4o")
        services["rag_service"] = rag_service

        api_service = ApiService()
        api_service.init(rag_service)
        services["api_service"] = api_service

        # Start the API service and handle potential cancellation
        try:
            await api_service.start()
        except asyncio.CancelledError:
            logger.info("API service start was cancelled, handling shutdown")
            # Don't call shutdown again if already in progress
            if not loop.__dict__.get("shutdown_in_progress", False):
                await shutdown(signal.SIGTERM, loop)
            return  # Exit gracefully

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        # Don't call shutdown again if already in progress
        if not loop.__dict__.get("shutdown_in_progress", False):
            await shutdown(signal.SIGTERM, loop)
        raise


if __name__ == "__main__":
    try:
        import nest_asyncio

        nest_asyncio.apply()  # Apply patch to allow nested event loops

        # Custom event loop configuration
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Run with our custom loop
        loop.run_until_complete(main())
        loop.close()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except asyncio.CancelledError:
        # This is expected during shutdown, don't treat it as an error
        pass
    except Exception as e:
        logger.error(f"Unhandled exception: {e}", exc_info=True)
    finally:
        logger.info("Application shutdown complete")
