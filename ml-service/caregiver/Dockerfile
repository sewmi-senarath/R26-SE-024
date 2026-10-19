# Caregiver stress model (Flask, port 5001)
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn
COPY . .
EXPOSE 5001
# gunicorn instead of app.run(debug=True): the Flask debug server is not for a public server
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "app:app"]
