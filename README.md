# gppredictor-addon

### Description
A userscript to be used on the http://gppredictor.com/ website which presents a user with an estimate on how much points they will receive based of their predictions.
![Like this](https://github.com/NitrogenUA/gppredictor-addon/blob/master/example.png)

### Features
estimates league points you will receive based of your prediction
calculates overall total points for each league member, according to estimated points gained
sorts the table to reflect total points estimated.

### Background
So as I was getting excited by the start of the 2016 F1 season friends invited me to take part in the F1 fantasy league at Autosport's GRAND PRIX PREDICTOR. I was having fun with it, but when the time to reap the points came I found myself slightly disappointed as I realized it might take from hours to days for the points to be calculated and put into the system. So I proceeded to code a solution around that. In retrospect - it took roughly 14-15 hours for points for australian GP to appear on the site, so it wasn't a terrible delay really. A that point, though, I was minutes away from finishing first functional draft of this script. And I knew it will still be useful for the next race and the ones after it. So I went on and finished it and now sharing it with the world. Although 'finished' might be an overstatement in this case as the work is still ongoing.

### Who is this intended for
Mostly for people who feel especially competitive about their fantasy leagues, like myself :3 As you will realize the script has value only within a short span of time between the checkered flag drops in the race and the gppredictor posting the points they have calculated themselves.

### How it actually works
The script initially checks wether gppredictor has posted the points for the latest GP or not. And then acts based of that condition. Which is why you will see it doing nothing for the most part. Unless there's a race finished, but the points aren't calculated by the gppredictor website yet. That is when the script will actually work. It will check every league members' predictions against the official race results. And based of that will estimate the points you can expect to see awarded later on. While I make no claim for accuracy of said estimate I did try match the scoring rules to the best of my ability.

### Known issues
The script is limited in terms of execution speed in a way that it can't go very fast due to the seeming requests throttling on the gppredictor website. It might take 5 to 10 seconds to process one league page(up to 20 members) so be patient.
Currently the script doesn't support multi-page leagues in a coherent way. This issue might get resolved in future updates.

### Debug mode
Enables you to see additional debug output inside your browser's DevTool/JS concole. To enable debug mode set the global variable 'debug' with 'true' value. It is set to 'false' by default. Additionally debug mode allows you to force the script to calculate the points regardless of wether gppredictor website has posted the points for the latest GP or not.

### Disclaimer
Original author of this software is affiliated with neither Autosport nor gppredictor websites. This software is originally intended for entertainment purposes and is meant as way to enrich your gppredictor experience. It might contain bugs or produce undesirable websites/browser behavior. Use it at your own risk. For copyright notice and license information see the LICENSE file included.
not sure about math on gppredictor's side.

### Additional information
gppredictor website: http://gppredictor.com/
Initially tested and indicated no issues on:
* Chrome 49/Tampermonkey 3
* Firefox 45/Greasemonkey 3.7
* Opera 36/Tampermonkey 4.
