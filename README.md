# Explore.moe

![Anime Info Page](https://andreruegg.com/images/AnimeInfoPage.JPG)

### What is Explore.Moe
As the name states, Explore.moe attempts to provide a way to explore moe culture. Explore.moe keeps its own small database of anime, which can easily be appended from the Administration panel, and uses resources from Kitsu to display series information. The primary reason for the existence of Explore.moe is to allow visitors to quickly find direct video URLs to the anime that they would like to watch. In order to do this, Explore.moe has a series of micro controllers, with each controller being paired to an anime streaming website, allowing the Explore.moe backend to automatically find direct links when given a name.

Live Demo: [Explore.Moe](http://explore.moe)

### Notice
Explore.moe is still very much in development, with a large amount of work to be done. It is one of my many personal projects, which help me become more comfortable or learn new technologies. Explore.Moe uses Express.js/Socket.io to serve content with a Jade as a templating engine.

### Installing
The Explore.Moe NPM project uses a file called config.js in the main directory to provide Admin Panel Login information

Make a config.js file
```
touch config.js
```

In your editor you like, export an object like the following:
```
var config = {};
config.adminUsername = "testusername";
config.adminPassword = "testpassword";

module.exports = config;
```

Once created, install project modules:
```
npm i
```

### Task List
- [ ] Update micro controllers
- [ ] Scheduler system to request updates for airing anime
- [ ] Search function
- [ ] Socket.io To-do list Administration Panel
- [ ] Swap JSON memory loading for SQL incase of horizontal scaling
