# YTtoMP3

  My own personal MP3 downloader that I created so I don't have to rely on using dodgy websites / third party applications. Also I can add my own features such as a download history and download queue. 
  This also lets me automate the process of downloading an mp3 and then uploading it to apple music library. 
  This application works for most other platforms such as soundcloud not just youtube.

  ## AI
  
  This is my first ever time using LLMs heavily in my own personal development since this is a pretty trivial project that I don't think is worth spending too much time on.

  ## Releases 

  I will add binary releases for windows and linux ubuntu soon.

  ## Building from source
  
  For now you can build from source by cloning and running
  ```
  git clone https://github.com/ChristosEfstathiades/YTtoMP3.git
  cd YTtoMP3
  npm i
  npm run make
  ```
  Then look in /out for the binaries.

  However you will need to install yt-dlp, FFmpeg, Nodejs, and python if your building from source
