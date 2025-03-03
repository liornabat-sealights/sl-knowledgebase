# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    gcc \
    g++ \
    python3-dev \
    make \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt first to leverage Docker cache
COPY ./requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install wheel && \
    pip install -r requirements.txt

# Stage 2: Final image
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
# (Only include packages that are needed at runtime)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/



COPY ./src ./src
COPY ./main.py ./main.py

EXPOSE 9000
CMD ["python", "main.py"]