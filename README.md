# CS 424 Fall 2016 - Visualization & Visual Analytics 1 
## Project 2

### Students
* [Federico Ruiz](https://github.com/fedex995)
* [Nicolas Burroni](https://github.com/nburroni)

### The Data
For this project we chose to show flight delays for domestic flights in the US in the year 2008, filtered by month.

#### Motivation & Audience
With each passing year, flights are becoming more and more important in people's lives. Whether it is for business or pleasure, people depend on them to be on time, and delays generally cause inconvenience and discomfort in airline users. By visualizing these delays from different perspectives, we hope to find patterns and possible reasons for the occurrance of these delays, and ideally help towards finding a solution.

We wanted to create a visualization dashboard that would allow airline passengers to get a sense of when and under what conditions it may be best to take a flight, looking at the delays these suffer. We intend to answer questions such as: 
* "Should I expect more delays on a 5pm flight than on an 8am flight?"
* "There is a big thunderstorm near my origin airport. Will my flight probably get delayed?"
* "Do flights on this route generally have big delays?".

#### Datasets
We used three different datasets for this project. The datasets were so large that we had to filter them 
##### [Airline on-time performance](http://stat-computing.org/dataexpo/2009/the-data.html)
This dataset provided all of the domestic flights for the year 2008, and included the following:
> Year, Month, DayofMonth, DayOfWeek, CRSDepTime, CRSArrTime, FlightNum, TailNum, ActualElapsedTime, ArrDelay, DepDelay, Origin, Dest, Cancelled, CarrierDelay, WeatherDelay, NASDelay, SecurityDelay, LateAircraftDelay

##### [Supplemental airport data](http://stat-computing.org/dataexpo/2009/supplemental-data.html)
This dataset provided extra information about US airports, which we referenced by their iata code.

airports.csv describes the locations of US airports, with the fields:
> iata (the international airport abbreviation code), name of the airport, city and country in which airport is located, the latitude and longitude of the airport

##### [Supplemental weather data](https://www.ncdc.noaa.gov/swdi/csv.html)
We used NOAA's Severe Weather Data Inventory to map weather events during 2008 to the weather-related delays indicated in the first dataset, in order to try to find some correlation between the two. This dataset included the following:
> BEGIN_YEARMONTH, BEGIN_DAY, BEGIN_TIME, END_YEARMONTH, END_DAY, END_TIME, EPISODE_ID, EVENT_ID, STATE, STATE_FIPS, YEAR, MONTH_NAME, EVENT_TYPE, county, lat, lon

### The Visualizations
#### Inspiration
[Force‐Directed Edge Bundling for Graph Visualization](http://onlinelibrary.wiley.com/doi/10.1111/j.1467-8659.2009.01450.x/full)
> Holten, Danny, and Jarke J. Van Wijk. "Force‐Directed Edge Bundling for Graph Visualization." Computer graphics forum. Vol. 28. No. 3. Blackwell Publishing Ltd, 2009.

We based one of our visualizations on this edge bundling technique. It helped reduce cluttering of the many thousands of edges we obtained with the chosen datasets. Nevertheless, filtering by the user is still required to get a more detailed view. This edge bundling technique also provides a good way to visualize high-level patterns in the data, such as traffic and general delays between areas or clusters of airports.

#### Link-node Map

#### Week Heat Map

#### Weather Heat Map

### How To Run
#### 1. Download the project source code
Either clone the project, or download it manually and extract it.

#### 2. Open a Terminal and run your favorite server
We developed this project using python's server functionality, so for best results we recommend using the same.
```bash
$ cd /path/to/source-code
$ python -m SimpleHTTPServer <port>
```

#### 3. Fire up Chrome (yes, please use Chrome)
We kindly ask for you to use Chrome, which is what we used while developing, and where we got the best results. Open it, and navigate to `http://localhost:<port>/`

#### 4. You're all set!
You can now explore the visualization dashboard.
