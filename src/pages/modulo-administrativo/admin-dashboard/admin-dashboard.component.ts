import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  template: ``,
})
export class AdminDashboardComponent implements OnInit {
  userName = '';

  ngOnInit(): void {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      this.userName = user.persona?.nombres ?? user.username ?? 'Admin';
    }
  }
}
