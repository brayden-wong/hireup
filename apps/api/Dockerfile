# ---- Builder Stage ----
# Use the Bun image as a base for building the application
FROM oven/bun:latest as builder

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definition files
# Corrected: Removed extra dot after filenames
COPY package.json ./
COPY bun.lock ./

# Install ALL dependencies (including devDependencies needed for build)
RUN bun install

# Copy the rest of the application source code
COPY . .

# Run the build command (ensure your package.json has a "build" script)
# This likely transpiles TS to JS, bundles, etc., outputting to /app/dist
RUN bun build

# ---- Production Stage ----
# Use the same Bun image (or potentially a slimmer runtime if available)
FROM oven/bun:latest

# Set the working directoryo9kmxdsc
WORKDIR /app

# Copy package.json and bun.lock again for installing production deps
COPY package.json ./
COPY bun.lock ./

# Install ONLY production dependencies.
# Bun automatically skips devDependencies if NODE_ENV=production (often set by default in images)
# or you can be explicit if needed (though `bun install` is usually smart enough)
# Consider setting NODE_ENV explicitly for clarity/safety:
ENV NODE_ENV=production
RUN bun install --production # Explicitly install only prod deps

# Copy the built application code from the builder stage
COPY --from=builder /app/dist ./dist

# Copy other necessary assets if your build doesn't include them (e.g., public folders, templates)
# COPY --from=builder /app/public ./public

# Expose the port the application will run on
EXPOSE 3000

# Define the command to run the application
# Assumes your build output's entry point is dist/index.js
CMD ["bun", "dist/server.js"]
