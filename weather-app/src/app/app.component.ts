import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DatePipe } from '@angular/common';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { CurrentWeather } from './current-weather';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  userInput: string = 'New York City';
  $data!: Observable<CurrentWeather>;
  errorMessage: string = '';
  backgroundImageUrl = '';
  forecastDays: any;
  groupedForecasts: { [date: string]: any[] } = {};
  timelineData: any = [];

  constructor(private http: HttpClient, private datePipe: DatePipe) {}
  ngOnInit() {
    this.searchWeather();
  }

  searchWeather() {
    // Remove spaces from the user's input to simplify detection
    const sanitizedInput = this.userInput.replace(/\s+/g, '');
    const zipCodePattern = /^\d{5}(?:-\d{4})?$/; // ZIP code pattern
    const isZipCode = zipCodePattern.test(this.userInput);
    let queryParam: string = isZipCode? "zip" : "q"
    let apiUrl = `https://api.openweathermap.org/data/2.5/weather?${queryParam}=${this.userInput}&units=imperial&appid=${environment.key}`;
    this.errorMessage = ''
    this.$data = this.http.get(apiUrl).pipe(
     map((data: any) => {
       return {
         visibility: data.visibility,
         windSpeed: data.wind.speed,
         degTemp: data.main.temp,
         feelsLikeTemp: data.main.feels_like,
         name: data.name,
         dt: this.datePipe.transform(new Date(data.dt * 1000), 'medium'),
         description: data.weather[0].description,
         country: data.sys.country,
       };
     }),
     catchError((error) => {
       this.errorMessage = error.error.message;

       return throwError('An error occurred while fetching weather data.');
     })
   );
    this.backgroundImageUrl = '';

    this.$data.subscribe({
      next: (data: any) => {
        switch (true) {
          case data.description.includes('clear') || data.description.includes('sun'):
            this.backgroundImageUrl = 'assets/sunny.jpg';
            break;
          case data.description.includes('cloud') :
            this.backgroundImageUrl = 'assets/clouds.jpg';
            break;
          case data.description.includes('rain') || data.description.includes('drizzle'):
              this.backgroundImageUrl = 'assets/rain.jpg';
            break;
          case data.description.includes('haze'):
            this.backgroundImageUrl = 'assets/haze.jpg'; // Use an appropriate hazy image
            break;
          case data.description.includes('fog'):
            this.backgroundImageUrl = 'assets/fog.jpg'; // Use an appropriate hazy image
            break;
          case data.description.includes('snow'):
            this.backgroundImageUrl = 'assets/snow.jpg'; // Use an appropriate hazy image
            break;
          default:
            this.backgroundImageUrl = 'assets/regularday.jpg';
        }
      },
    });
    this.timelineData = []
    this.forcastWeather();
  }

  forcastWeather() {
  this.groupedForecasts = {}
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${this.userInput}&cnt=40&units=imperial&appid=${environment.key}`;
  this.http.get(forecastURL).subscribe({
     next: (data: any) => {
       data.list.forEach((item: any) => {
         const date = new Date(item.dt * 1000).toDateString();
         if (!this.groupedForecasts[date]) {
           this.groupedForecasts[date] = [];
         }
         item.dt = this.datePipe.transform(new Date(item.dt * 1000), 'medium');
         this.groupedForecasts[date].push(item);
       });
       // convert grouped forecasts to an array to store the 5-days' dates
       this.forecastDays = Object.keys(this.groupedForecasts).map((date) => (date));
     },
   });
  }

  showTimeline(date: any) {
    this.timelineData = this.groupedForecasts[date];
  }

}
