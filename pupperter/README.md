# Docker

1. Build the docker file
```cmd
docker build -t puppeteer-container . 
```

2. Run the docker
```cmd
docker run --rm puppeteer-container
```

3. for debug purpose can enter the terminal
```
docker run -it puppeteer-container bash
```

4. if want mound folder 
```cmd
docker run --rm -v "C:\Users\USER\Desktop\pupperter:/usr/src/app"  puppeteer-container
```
if show puppeter not found pls enter docker image terminal and run npm install
```cmd
docker run --rm -v "C:\Users\USER\Desktop\pupperter:/usr/src/app" -it puppeteer-container bash
npm install
```

# Express server

1. install the express modules
```cmd
npm install express
```

2. start the server with
```cmd
node server.js
```
