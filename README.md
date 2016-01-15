# Meetup Dice!

A simple Node.js application for picking a random RSVP'd member from a Meetup.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Contributors:

* [Harlan Harris](http://github.com/HarlanH)
* [Devin Castro](http://github.com/ddcast)
* [Chetan Shenoy](https://github.com/cshenoy)
* [Sheng Zhao](https://github.com/itsheng)
* [FVCproductions](https://github.com/fvcproductions)

To run locally:

```bash
    MEETUP_API_KEY=1234567890 node web.js
```

To deploy on Heroku with your API key (which will publicly display all of your Meetups):

```bash
    heroku apps:create my-app-name
    git push heroku master
    heroku config:set MEETUP_API_KEY=1234567890
```
