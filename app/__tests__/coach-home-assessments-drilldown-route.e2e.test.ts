import fs from 'node:fs';
import path from 'node:path';

import {
  buildAssessmentsDrillDownHref,
  parseAssessmentRouteState,
  buildAssessmentQueryFilters,
  buildClearDrillDownHref,
} from '../../lib/assessments/drillDown';

const appDir = path.resolve(__dirname, '..');

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.join(appDir, relativePath), 'utf8');
}

function queryParamsFromHref(href: string): URLSearchParams {
  const query = href.split('?')[1] ?? '';
  return new URLSearchParams(query);
}

describe('coach-home drill-down route flow', () => {
  it('builds assessments drill-down href with competency/date params', () => {
    const now = new Date('2026-03-02T00:00:00.000Z');
    const href = buildAssessmentsDrillDownHref(
      {
        competencyId: 'comp-42',
        competencyTitle: 'Patient Assessment',
        periodStartIso: '2026-01-06T00:00:00.000Z',
      },
      now
    );

    expect(href).toContain('/assessments?');
    expect(href).toContain('status=all');
    expect(href).toContain('focus=all');
    expect(href).toContain('date_window=custom');
    expect(href).toContain('competency_id=comp-42');
    expect(href).toContain('competency_title=Patient+Assessment');
    expect(href).toContain('date_from=2026-01-06T00%3A00%3A00.000Z');
    expect(href).toContain('date_to=2026-03-02T00%3A00%3A00.000Z');
  });

  it('hydrates assessment query filters from route params and supports clear-filter href', () => {
    const routeState = parseAssessmentRouteState({
      status: 'all',
      focus: 'all',
      competency_id: 'comp-42',
      competency_title: 'Patient Assessment',
      date_window: 'custom',
      date_from: '2026-01-06T00:00:00.000Z',
      date_to: '2026-03-02T00:00:00.000Z',
    });

    const filters = buildAssessmentQueryFilters(routeState, new Date('2026-03-02T00:00:00.000Z'));
    expect(filters).toEqual({
      competency_id: 'comp-42',
      assessed_from: '2026-01-06T00:00:00.000Z',
      assessed_to: '2026-03-02T00:00:00.000Z',
    });

    expect(
      buildClearDrillDownHref({
        status: 'reviewed',
        focus: 'overdue',
        competency_id: 'comp-42',
        date_window: 'custom',
        date_from: '2026-01-06T00:00:00.000Z',
        date_to: '2026-03-02T00:00:00.000Z',
        templateId: 'tmpl-1',
      })
    ).toBe('/assessments?status=all&focus=all&templateId=tmpl-1');
  });

  it('round-trips assessment filter serialization for status/focus/date_window/competency params', () => {
    const baseHref = buildAssessmentsDrillDownHref(
      {
        competencyId: 'comp-99',
        competencyTitle: 'Crew Communication',
        periodStartIso: '2026-02-01T00:00:00.000Z',
      },
      new Date('2026-03-02T00:00:00.000Z')
    );
    const params = queryParamsFromHref(baseHref);
    params.set('status', 'reviewed');
    params.set('focus', 'overdue');

    const state = parseAssessmentRouteState({
      status: params.get('status') || undefined,
      focus: params.get('focus') || undefined,
      date_window: params.get('date_window') || undefined,
      competency_id: params.get('competency_id') || undefined,
      competency_title: params.get('competency_title') || undefined,
      date_from: params.get('date_from') || undefined,
      date_to: params.get('date_to') || undefined,
    });

    expect(state.selectedStatus).toBe('reviewed');
    expect(state.selectedFocus).toBe('overdue');
    expect(state.selectedDateWindow).toBe('custom');
    expect(state.selectedCompetencyId).toBe('comp-99');
    expect(state.selectedCompetencyTitle).toBe('Crew Communication');
    expect(state.dateFromOverride).toBe('2026-02-01T00:00:00.000Z');
    expect(state.dateToOverride).toBe('2026-03-02T00:00:00.000Z');
  });

  it('falls back safely for malformed competency/date drill-down params', () => {
    const malformedState = parseAssessmentRouteState({
      status: 'totally-invalid',
      focus: 'invalid-focus',
      competency_id: 'comp-42;drop table',
      competency_title: 'Unsafe',
      date_window: 'invalid-window',
      date_from: 'not-a-date',
      date_to: 'still-not-a-date',
    });

    expect(malformedState.selectedStatus).toBe('all');
    expect(malformedState.selectedFocus).toBe('all');
    expect(malformedState.selectedCompetencyId).toBeNull();
    expect(malformedState.selectedCompetencyTitle).toBeNull();
    expect(malformedState.selectedDateWindow).toBe('all');
    expect(malformedState.dateFromOverride).toBeNull();
    expect(malformedState.dateToOverride).toBeNull();
  });

  it('preserves non-drilldown params when building clear-filter href', () => {
    const href = buildClearDrillDownHref({
      status: 'submitted',
      focus: 'due_today',
      competency_id: 'comp-42',
      competency_title: 'Patient Assessment',
      date_window: 'custom',
      date_from: '2026-01-06T00:00:00.000Z',
      date_to: '2026-03-02T00:00:00.000Z',
      templateId: 'tmpl-1',
      page: '2',
      sort: 'recent',
    });
    const params = queryParamsFromHref(href);

    expect(params.get('status')).toBe('all');
    expect(params.get('focus')).toBe('all');
    expect(params.get('templateId')).toBe('tmpl-1');
    expect(params.get('page')).toBe('2');
    expect(params.get('sort')).toBe('recent');
    expect(params.get('competency_id')).toBeNull();
    expect(params.get('competency_title')).toBeNull();
    expect(params.get('date_window')).toBeNull();
    expect(params.get('date_from')).toBeNull();
    expect(params.get('date_to')).toBeNull();
  });

  it('preserves non-drilldown array query params when clearing drill-down filters', () => {
    const href = buildClearDrillDownHref({
      status: ['submitted', 'reviewed'],
      focus: ['due_today', 'overdue'],
      competency_id: ['comp-42', 'comp-99'],
      competency_title: 'Patient Assessment',
      date_window: 'custom',
      date_from: '2026-01-06T00:00:00.000Z',
      date_to: '2026-03-02T00:00:00.000Z',
      templateId: ['tmpl-1', 'tmpl-2'],
      page: ['2', '3'],
    });
    const params = queryParamsFromHref(href);

    expect(params.get('status')).toBe('all');
    expect(params.get('focus')).toBe('all');
    expect(params.getAll('templateId')).toEqual(['tmpl-1', 'tmpl-2']);
    expect(params.getAll('page')).toEqual(['2', '3']);
    expect(params.get('competency_id')).toBeNull();
    expect(params.get('date_window')).toBeNull();
    expect(params.get('date_from')).toBeNull();
    expect(params.get('date_to')).toBeNull();
  });

  it('wires drill-down tap, clear-filter action, and back navigation in screens', () => {
    const clientsSource = readAppFile('(tabs)/clients.tsx');
    const assessmentsSource = readAppFile('assessments.tsx');

    expect(clientsSource).toContain('testID={`coach-trend-row-${trend.competency_id}`}');
    expect(clientsSource).toContain('onPress={() => handleTrendPress(trend)}');
    expect(clientsSource).toContain('buildAssessmentsDrillDownHref');

    expect(assessmentsSource).toContain('testID="assessments-clear-drilldown-filters"');
    expect(assessmentsSource).toContain('router.replace(buildClearDrillDownHref(params) as any)');
    expect(assessmentsSource).toContain('testID="assessments-back-button"');
    expect(assessmentsSource).toContain('onPress={() => router.back()}');
  });
});
