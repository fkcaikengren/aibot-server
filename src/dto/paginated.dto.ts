export class PaginatedDto<TData> {
  total: number;
  results: TData[];
}
