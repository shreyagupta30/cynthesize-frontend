import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ProjectService } from '@app/core/project/project.service';
import { finalize, startWith, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '@app/core/error-handler.service';
import { MatChipInputEvent, MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { TAGS } from '@app/shared/constants';
import { AuthenticationService } from '@app/core';
import { Title } from '@angular/platform-browser';
import { ProfileService } from '@app/core/profile/profile.service';

@Component({
  selector: 'app-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit {
  isLinear = false;
  project: FormGroup;
  formNotfilled = false;
  errorMessage = '';
  isPageLoading = false;
  isFormSubmitted = false;
  projectDescription = '';
  options: any = {
    lineWrapping: true
  };
  isLoading = false;
  stages: String[] = [
    'Ideation',
    'Execution Ongoing',
    'MVP Ready',
    'Pre-production',
    'Beta Testing',
    'Production ready',
    'In Production'
  ];

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl();
  filteredTags: Observable<any[]>;
  tags: any[] = [];

  @ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  allTags = TAGS;

  constructor(
    private _formBuilder: FormBuilder,
    private projectService: ProjectService,
    private profileService: ProfileService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private title: Title,
    public authenticationService: AuthenticationService
  ) {
    this.project = this._formBuilder.group({
      projectName: ['', Validators.required],
      icon: ['', Validators.required],
      abstract: ['', [Validators.required, Validators.maxLength(100)]],
      website: ['https://', Validators.required],
      isPublic: false
    });
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: any | null) => (tag ? this._filter(tag) : this.allTags.slice()))
    );
    this.title.setTitle('Cynthesize | Add Project');
  }

  ngOnInit() {}

  addProject() {
    this.isFormSubmitted = true;
    const projectDetails = {
      projectName: this.project
        .get('projectName')
        .value.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/ /g, '-'),
      currentStage: 'ideation_stage',
      abstract: this.project.get('abstract').value.trim(),
      isPublic: this.project.get('isPublic').value,
      website: this.project.get('website').value,
      icon: this.project.get('icon').value
    };
    if (!projectDetails.projectName || !projectDetails.abstract) {
      this.errorMessage = 'Please enter the details correctly.';
      this.isFormSubmitted = false;
    } else {
      this.errorMessage = '';
      this.projectService.addProject(projectDetails).subscribe(
        (data: any) => {
          this.projectService
            .addProjectTags(this.tags, data.data.insert_projects.returning[0].id)
            .subscribe((ret: any) => {
              console.log('Tags added for the project.');
            });
          this.projectService.addProjectDescription(data.data.insert_projects.returning[0].id).subscribe((ret: any) => {
            this.isFormSubmitted = true;
            this.router.navigate([
              '/view/project/' +
                data.data.insert_projects.returning[0].id +
                '-' +
                data.data.insert_projects.returning[0].project_name
            ]);
          });
        },
        (error: any) => {
          this.isFormSubmitted = false;
          this.errorHandler.subj_notification.next(error);
        }
      );
    }
  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if ((value || '').trim()) {
        this.tags.push(value.trim());
      }
      if (input) {
        input.value = '';
      }

      this.tagCtrl.setValue(null);
    }
  }

  remove(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.value);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  readURL(input: any) {
    console.log(input);
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e: any) {
        console.log(e);
        document.getElementById('imagePreview').style.backgroundImage = 'url(' + e.target.result + ')';
      };
      reader.readAsDataURL(input.files[0]);
      this.profileService.uploadImage(input.files[0]).subscribe((data: any) => {
        console.log(data);
        this.project.get('icon').setValue(data.url);
      });
    }
  }

  private _filter(value: any): any[] {
    let filterValue = value.tag_name || value;
    filterValue = filterValue.toLowerCase();

    return this.allTags.filter(tag => tag.tag_name.toLowerCase().indexOf(filterValue) === 0);
  }
}
