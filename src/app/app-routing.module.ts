import { NavigationPage } from './component/navigation/navigation.page';
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: NavigationPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule),
        // canActivate: [AuthGuard]
      },
      {
        path: 'schedule',
        loadChildren: () => import('./pages/schedule/schedule.module').then( m => m.SchedulePageModule),
        // canActivate: [AuthGuard]
      },
      {
        path: 'request',
        loadChildren: () => import('./pages/request/request.module').then( m => m.RequestPageModule),
        // canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/auth/login/login.module').then( m => m.LoginPageModule),
    data: {
      auth: true
    }
  },
  {
    path: 'verify-otp',
    loadChildren: () => import('./pages/auth/verify-otp/verify-otp.module').then( m => m.VerifyOtpPageModule),
    data: {
      auth: true
    }
  },
  {
    path: 'signup',
    loadChildren: () => import('./pages/auth/register/register.module').then( m => m.RegisterPageModule),
    data: {
      auth: true
    }
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then( m => m.SettingsPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})

export class AppRoutingModule { }
