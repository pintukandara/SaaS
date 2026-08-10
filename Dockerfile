# Use the official Python slim image
FROM python:3.14-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for compilation (e.g., mysqlclient, cryptography, rpds-py)
# Installing rustc and cargo allows Rust-based packages to build from source
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    rustc \
    cargo \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy requirements.txt from the host root to the container
COPY requirements.txt /app/

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt gunicorn


# Copy the Backend project code to the container
COPY Backend/employee_tasks_saas/ /app/

# Expose the default Django port
EXPOSE 8000

# Start the Django development server
CMD ["gunicorn","employee_tasks_saas.wsgi.application","--bind","0.0.0.0:8000","--workers","3"]
