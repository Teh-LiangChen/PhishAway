# Use an official Node.js version 18 more stable 
FROM node:20

# install the google chrome inside the docker image
RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Puppeteer and other Node.js dependencies
# set up working directory inside container and all the things will be install here
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
# install the dependencies in package.json 
RUN npm install

# Copy the rest of your project files into the container
COPY analyze.js Dockerfile README.md .

# Command to run your Puppeteer script
CMD ["node", "analyze.js"]
