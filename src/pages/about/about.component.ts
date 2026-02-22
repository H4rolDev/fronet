import { Component, OnInit } from "@angular/core";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CommonModule } from '@angular/common';
import { CarouselComponent, CarouselControlComponent, CarouselInnerComponent,
  CarouselItemComponent, ThemeDirective} from '@coreui/angular';
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-about",
  templateUrl: './about.component.html',
  imports: [
    CommonModule,
    ThemeDirective, CarouselComponent, CarouselInnerComponent, 
    CarouselItemComponent, CarouselControlComponent, RouterLink
  ]
})

export class AboutComponent implements OnInit {
  slides: any[] = [];

  ngOnInit(): void {
    this.slides = [
      {
        src: 'assets/torta-vainilla.jpg',
        title: 'Torta de Vainilla',
        subtitle: 'Sabor clásico, textura suave'
      },
      {
        src: 'assets/torta-leche.jpg',
        title: 'Torta de Tres Leches',
        subtitle: 'Una delicia húmeda y dulce'
      },
      {
        src: 'assets/torta.png',
        title: 'Torta personalizada',
        subtitle: 'Diseño a tu medida'
      }
    ];
  }

  onItemChange(event: any): void {
    console.log('carousel onItemChange', event);
  }
}

