import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@fastfood/shared-types';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  getCategories() {
    return this.menuService.getCategories();
  }

  @Get()
  getMenu(@Query('categoryId') categoryId?: string) {
    return this.menuService.getMenu(categoryId);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.menuService.searchMenu(q ?? '');
  }

  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.menuService.getItemById(id);
  }

  // ── Admin-only routes ──────────────────────
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  createCategory(@Body() body: any) {
    return this.menuService.createCategory(body);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  createItem(@Body() body: any) {
    return this.menuService.createMenuItem(body);
  }

  @Patch('items/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  toggleAvailability(@Param('id') id: string) {
    return this.menuService.toggleAvailability(id);
  }
}
