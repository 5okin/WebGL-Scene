# WebGL Scene

A WebGL scene with textures created using glMatrix.

You can stop/start the automatic swiveling camera, select a preset camera angle, control the camera using the mouse, change the fov or the camera distance, and control the rotation of the chair using the mouse wheel. If the chair is dropped four times, then the chair back breaks off and stays on the floor.

You can play around with it here: https://5okin.github.io/WebGL-Scene/

## Screenshots
###### User Controls:
![Controls](https://user-images.githubusercontent.com/70406237/181815573-a439e9d0-9344-4351-a38c-06d8981b0816.png)

###### Scene:
|Scene | Chair Rotation | Chair on floor|Chair back broken off |
|:---:|:---:|:---:|:---:|
|![ScreenShot](https://user-images.githubusercontent.com/70406237/181810401-461d5980-c5ae-4c7b-8063-7c7024efa229.png)|![ScreenShot2](https://user-images.githubusercontent.com/70406237/181810972-76f3141b-3f91-4802-b9e0-a27a78f0377b.png)|![ScreenShot3](https://user-images.githubusercontent.com/70406237/181811578-9569cadb-0ad8-4b16-b29e-e7cd323b0ebd.png)|![ScreenShot4](https://user-images.githubusercontent.com/70406237/181812020-67fa886c-94f2-4034-9d43-774e57a8a150.png)|

## Running

If you're running it locally and getting a black canvas and cross-orgin data or resource (CORS) warnings then you have to change your browsers policy.

#### Firefox
Go to about:config and change security.fileuri.strict_origin_policy to false

#### Chrome or Edge
Start the browser with --disable-web-security argument.
So in windows you have to create a new shortcut with a target that looks like:
```
"[PATH_TO_CHROME]\chrome.exe" --disable-web-security --disable-gpu --user-data-dir=~/chromeTemp
```
