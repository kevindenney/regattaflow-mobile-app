import {
  buildClearProgramCommunicationsHref,
  buildProgramCommunicationsHref,
  parseCommunicationsFocusParam,
  parseProgramIdParam,
  parseProgramTitleParam,
} from '../drillDown';

describe('communications drill-down helpers', () => {
  it('builds program communications href with program context', () => {
    const href = buildProgramCommunicationsHref({
      programId: 'prog-123',
      programTitle: 'Cohort 7',
    });
    const params = new URLSearchParams(href.split('?')[1]);

    expect(href.startsWith('/communications?')).toBe(true);
    expect(params.get('program_id')).toBe('prog-123');
    expect(params.get('program_title')).toBe('Cohort 7');
  });

  it('supports unread focus in drill-down href', () => {
    const href = buildProgramCommunicationsHref({
      programId: 'prog-123',
      focus: 'unread',
    });
    const params = new URLSearchParams(href.split('?')[1]);

    expect(params.get('focus')).toBe('unread');
  });

  it('parses and sanitizes route params', () => {
    expect(parseProgramIdParam('prog_abc-123')).toBe('prog_abc-123');
    expect(parseProgramIdParam('bad/id')).toBeNull();

    expect(parseCommunicationsFocusParam('unread')).toBe('unread');
    expect(parseCommunicationsFocusParam('all')).toBe('all');
    expect(parseCommunicationsFocusParam('weird')).toBe('all');

    expect(parseProgramTitleParam(' Cohort 8 ', true)).toBe('Cohort 8');
    expect(parseProgramTitleParam(' Cohort 8 ', false)).toBeNull();
  });

  it('clears only program filter while preserving unread focus', () => {
    expect(buildClearProgramCommunicationsHref({ focus: 'unread' })).toBe('/communications?focus=unread');
    expect(buildClearProgramCommunicationsHref({ focus: 'all' })).toBe('/communications');
  });
});
