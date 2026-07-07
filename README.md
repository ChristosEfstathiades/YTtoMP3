# YTtoMP3

  My own personal MP3 downloader that I created so I don't have to rely on using dodgy websites / third party applications. Also I can add my own features such as a download history and download queue. 
  This also lets me automate the process of downloading an mp3 and then uploading it to apple music library. 
  This application works for most other platforms such as soundcloud not just youtube.

  ## AI
  
  This is my first ever time using LLMs heavily in my own personal development since this is a pretty trivial project that I don't think is worth spending too much time on.

  ## Installation 

  Look in releases for install files for Windows/Linux  
  Windows - saggysonic-1.0.0.Setup.exe  
  Debian - saggysonic_1.0.0_amd64.deb  
  RPM - saggysonic-1.0.0-1.x86_64.rpm  

  ## Building from source
  
  You can build from source by running
  ```
  git clone https://github.com/ChristosEfstathiades/YTtoMP3.git
  cd YTtoMP3
  npm i
  npm run make
  ```
  Then look in /out for the binaries.

  However you will need to install yt-dlp, FFmpeg, Nodejs, and python if your building from source
