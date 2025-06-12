#!/bin/bash

# Script to generate self-signed SSL certificates for development

echo "🔐 Generating SSL certificates for development..."

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out certs/server.key 2048

# Generate certificate signing request
echo "📋 Generating certificate signing request..."
openssl req -new -key certs/server.key -out certs/server.csr -subj "/C=US/ST=Development/L=Local/O=Dev/OU=Dev/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
echo "🏆 Generating self-signed certificate..."
openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt

# Clean up CSR file
rm certs/server.csr

echo "✅ SSL certificates generated successfully!"
echo "📁 Files created:"
echo "   - certs/server.key (private key)"
echo "   - certs/server.crt (certificate)"
echo ""
echo "🚀 You can now run your app with SSL using:"
echo "   npm run dev:ssl"
echo ""
echo "⚠️  Note: Browser will show security warning for self-signed certificates"
echo "   This is normal for development. Click 'Advanced' and 'Proceed to localhost'" 