import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { MediaChange, ObservableMedia } from '@angular/flex-layout';
import { MatSidenav } from '@angular/material';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '@app/core/error-handler.service';
import { SelectPipe } from 'apollo-angular';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  @ViewChild('sidenav')
  sidenav: MatSidenav;
  flag = 0;

  constructor(private media: ObservableMedia, private router: Router, private errorHandler: ErrorHandlerService) {}

  ngOnInit() {
    this.media
      .asObservable()
      .pipe(filter((change: MediaChange) => change.mqAlias !== 'xs' && change.mqAlias !== 'sm'))
      .subscribe(() => this.sidenav.close());
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    if (
      event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight &&
      this.router.url === '/view/launched' &&
      event.target.scrollHeight !== this.flag
    ) {
      this.flag = event.target.scrollHeight;
      this.errorHandler.ideaWindowScrolled.next('fetchLaunchedProjects');
    }
  }
}
