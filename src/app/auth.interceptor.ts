import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) return next(request);

  try {
    const user = JSON.parse(rawUser) as { token?: string };
    if (!user.token) return next(request);
    return next(request.clone({
      setHeaders: { Authorization: `Bearer ${user.token}` },
    }));
  } catch (_) {
    return next(request);
  }
};
