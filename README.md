# DotLoading  
Fancy loading screen animation for your app.


# How to use?
Step 1: Include animation.js or animation.min.js in your app  
Step 2: Create a full-page canvas, however you like, and assign it an ID.  
Step 3: Create a object `dotLoadingConfig` with a key `canvas` containing the ID of your canvas. Put the object in window.  
Step 4: Call `window.dotLoading.startEverything();`

# Example?
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>mouse thing</title>
    <style>
        body {
            margin: 0;
            background: #222;
            width: 100vw;
            height: 100vh;
            overflow-y: hidden;
            overflow-x: hidden;
        }
        .flexCenter {
            width: 100%;
            height: 100%;
            align-items: center;
            justify-content: center;
            display: flex;
            background: #0003;
        }
        h1 {
            color: white;
            font-family: sans-serif;
            font-size: 72px;
        }

    </style>
</head>
<body>
    <div class="flexCenter">
        <h1>Loading</h1>
    </div>
    <canvas style="width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; z-index: -1;" id="__particles_canvas"></canvas>

    <script src="animation.js"></script>
    <script>
      window.dotLoadingConfig = { "canvas": "__particles_canvas" };
      window.dotLoading.startEverything();
    </script>
</body>
</html>
```
