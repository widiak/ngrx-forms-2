import 'rxjs';

import { Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Action, ActionsSubject } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { SetValueAction } from '../../actions';
import { NgrxFormsModule } from '../../module';
import { createFormControlState, FormControlState } from '../../state';

const RADIO_OPTIONS = ['op1', 'op2'];

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'radio-test',
  template: '<input *ngFor="let o of options; trackBy: trackByIndex" type="radio" [value]="o" [ngrxFormControlState]="state" />',
})
export class RadioTestComponent {
  @Input() state: FormControlState<string>;
  options = RADIO_OPTIONS;
  trackByIndex = (index: number) => index;
}

describe(RadioTestComponent.name, () => {
  let component: RadioTestComponent;
  let fixture: ComponentFixture<RadioTestComponent>;
  let actionsSubject: ActionsSubject;
  let actions$: Observable<Action>;
  let element1: HTMLInputElement;
  let element2: HTMLInputElement;
  const FORM_CONTROL_ID = 'test ID';
  const INITIAL_FORM_CONTROL_VALUE = RADIO_OPTIONS[1];
  const INITIAL_STATE = createFormControlState(FORM_CONTROL_ID, INITIAL_FORM_CONTROL_VALUE);

  beforeEach(() => {
    actionsSubject = new Subject<Action>() as ActionsSubject;
    actions$ = actionsSubject as Observable<Action>; // cast required due to mismatch of lift() function signature
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NgrxFormsModule],
      declarations: [RadioTestComponent],
      providers: [{ provide: ActionsSubject, useValue: actionsSubject }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadioTestComponent);
    component = fixture.componentInstance;
    component.state = INITIAL_STATE;
    fixture.detectChanges();
    element1 = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[0];
    element2 = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[1];
  });

  it('should set the name of all elements to the ID of the state', () => {
    expect(element1.name).toBe(INITIAL_STATE.id);
    expect(element2.name).toBe(INITIAL_STATE.id);
  });

  it('should update the name of the elements if the state\'s ID changes', () => {
    const newId = 'new ID';
    component.state = { ...INITIAL_STATE, id: newId };
    fixture.detectChanges();
    expect(element1.name).toBe(newId);
    expect(element2.name).toBe(newId);
  });

  it('should select the correct option initially', () => {
    expect(element2.checked).toBe(true);
  });

  it('should trigger a SetValueAction with the selected value when an option is selected', done => {
    actions$.take(1).subscribe(a => {
      expect(a.type).toBe(SetValueAction.TYPE);
      expect((a as SetValueAction<string>).payload.value).toBe(RADIO_OPTIONS[0]);
      done();
    });

    element1.click();
  });

  it('should trigger SetValueActions when switching between options', done => {
    actions$.bufferCount(2).take(1).subscribe(([a1, a2]) => {
      expect(a1.type).toBe(SetValueAction.TYPE);
      expect(a2.type).toBe(SetValueAction.TYPE);
      expect((a1 as SetValueAction<string>).payload.value).toBe(RADIO_OPTIONS[0]);
      expect((a2 as SetValueAction<string>).payload.value).toBe(RADIO_OPTIONS[1]);
      done();
    });

    element1.click();
    component.state = { ...component.state, value: RADIO_OPTIONS[0] };
    fixture.detectChanges();
    element2.click();
  });

  it('should trigger a SetValueAction if the value of the selected option changes', done => {
    const newValue = 'new value';

    actions$.take(1).subscribe(a => {
      expect(a.type).toBe(SetValueAction.TYPE);
      expect((a as SetValueAction<string>).payload.value).toBe(newValue);
      done();
    });

    component.options[1] = newValue;
    fixture.detectChanges();
  });

  it('should deselect other options when option is selected', () => {
    element1.click();
    expect(element2.checked).toBe(false);
  });
});
