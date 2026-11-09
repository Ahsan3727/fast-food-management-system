import { MenuService } from './menu.service';

function buildService(rows: any[] = []) {
  const lean = jest.fn().mockResolvedValue(rows);
  const sort = jest.fn().mockReturnValue({ lean });
  const find = jest.fn().mockReturnValue({ sort, lean });
  const menuItemModel: any = { find };
  const categoryModel: any = {};
  return { service: new MenuService(categoryModel, menuItemModel), find, sort, lean };
}

describe('MenuService.getMenu', () => {
  it('returns items in a stable order: oldest first, _id as tie-breaker', async () => {
    const { service, sort } = buildService([{ name: 'A' }, { name: 'B' }]);
    const rows = await service.getMenu();
    expect(rows).toEqual([{ name: 'A' }, { name: 'B' }]);
    expect(sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
  });

  it('only returns available items unless asked for sold-out ones too', async () => {
    const { service, find } = buildService();
    await service.getMenu();
    expect(find).toHaveBeenLastCalledWith({ isAvailable: true });
    await service.getMenu(undefined, true);
    expect(find).toHaveBeenLastCalledWith({});
  });

  it('filters by category and still sorts', async () => {
    const { service, find, sort } = buildService();
    await service.getMenu('cat-1', true);
    expect(find).toHaveBeenLastCalledWith({ categoryId: 'cat-1' });
    expect(sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
  });
});
