from pyvis.network import Network
import tempfile
import os
import aiofiles
from pathlib import Path


async def visualize_graph(graph, file_path) -> str:
    """
    Visualize the graph and return the HTML content as a string.

    Args:
        graph: NetworkX graph object
        file_path: Path to the graph file (for reference only)

    Returns:
        str: HTML content of the visualization
    """
    # Create network
    net = Network(notebook=True)
    net.from_nx(graph)

    # Create a temporary file
    temp_dir = tempfile.gettempdir()
    temp_path = Path(temp_dir) / f"temp_graph_{os.urandom(8).hex()}.html"

    try:
        # Save to temporary file
        net.show(str(temp_path))

        # Read the contents asynchronously
        async with aiofiles.open(temp_path, mode="r", encoding="utf-8") as f:
            html_content = await f.read()

        return html_content

    finally:
        # Clean up the temporary file
        try:
            if temp_path.exists():
                os.unlink(temp_path)
        except Exception as e:
            raise Exception(
                f"Warning: Failed to delete temporary file {temp_path}: {e}"
            )
        return html_content
