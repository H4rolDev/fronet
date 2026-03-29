import { Component, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import Aos from 'aos';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderClientComponent } from './header-client/header-client.component';
import { FooterClientComponent } from './footer-client/footer-client.component';

@Component({
  selector: 'app-principal-client',
  imports: [RouterOutlet, HeaderClientComponent, FooterClientComponent],
  templateUrl: './principal-client.component.html',
  styleUrl: './principal-client.component.css',
  standalone: true,
})
export class PrincipalClientComponent {

}
