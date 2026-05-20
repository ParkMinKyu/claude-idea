import { describe, it, expect } from 'vitest';
import { parseDockerfile } from '../src/lib/parser';

describe('parseDockerfile', () => {
  it('parses instructions with line numbers', () => {
    const df = ['FROM node:20', 'WORKDIR /app', 'COPY . .'].join('\n');
    const instrs = parseDockerfile(df);
    expect(instrs).toHaveLength(3);
    expect(instrs[0]).toMatchObject({ instruction: 'FROM', args: 'node:20', line: 1 });
    expect(instrs[2]).toMatchObject({ instruction: 'COPY', line: 3 });
  });

  it('skips comments and blank lines', () => {
    const df = ['# comment', '', 'FROM alpine', '  # indented comment', 'CMD ["sh"]'].join('\n');
    const instrs = parseDockerfile(df);
    expect(instrs.map((x) => x.instruction)).toEqual(['FROM', 'CMD']);
    expect(instrs[1].line).toBe(5);
  });

  it('joins line continuations into one instruction', () => {
    const df = ['RUN apt-get update \\', '    && apt-get install -y curl'].join('\n');
    const instrs = parseDockerfile(df);
    expect(instrs).toHaveLength(1);
    expect(instrs[0].instruction).toBe('RUN');
    expect(instrs[0].args).toContain('apt-get update');
    expect(instrs[0].args).toContain('install -y curl');
    expect(instrs[0].line).toBe(1);
  });

  it('uppercases the instruction keyword', () => {
    const instrs = parseDockerfile('from node:20');
    expect(instrs[0].instruction).toBe('FROM');
  });
});
