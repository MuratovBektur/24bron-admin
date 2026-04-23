import { SetMetadata } from '@nestjs/common';

export const COMPLEX_ACCESS_KEY = 'complex_access';
export type ComplexAccessType = 'pitch' | 'complex';

export const CheckComplexAccess = (type: ComplexAccessType) =>
  SetMetadata(COMPLEX_ACCESS_KEY, type);
