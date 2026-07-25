import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { spawn } from 'child_process';
import * as path from 'path';

export interface RegionalConsultantRequest {
  query: string;
  region?: 'latin_america' | 'southeast_asia' | 'middle_east' | '';
  industry?: string;
}

const REGION_LABELS: Record<string, string> = {
  latin_america: '중남미',
  southeast_asia: '동남아시아',
  middle_east: '중동·북아프리카',
  '': '글로벌',
};

@Injectable()
export class RegionalConsultantService {
  private readonly logger = new Logger(RegionalConsultantService.name);

  private readonly VENV_PYTHON = path.resolve(
    process.cwd(),
    'mcp/venv/Scripts/python.exe',
  );
  private readonly AGENT_SCRIPT = path.resolve(
    process.cwd(),
    'mcp/agents/regional_consultant_agent.py',
  );

  /**
   * 지역전문가 컨설턴트 Agent를 Python 자식 프로세스로 실행
   * Brave Search MCP + Fetch MCP 다중 서버 활용
   */
  runRegionalConsultant(req: RegionalConsultantRequest): Observable<any> {
    const subject = new Subject<any>();

    (async () => {
      try {
        const regionLabel = REGION_LABELS[req.region ?? ''] ?? req.region;
        subject.next({
          data: JSON.stringify({
            type: 'status',
            text: `지역전문가 컨설턴트 에이전트 시작 (${regionLabel})...`,
          }),
        });

        this.logger.log(
          `Regional Consultant Agent 실행: region="${req.region || 'global'}" industry="${req.industry || '-'}"`,
        );

        const child = spawn(
          this.VENV_PYTHON,
          [
            this.AGENT_SCRIPT,
            '--query', req.query,
            ...(req.region ? ['--region', req.region] : []),
            ...(req.industry ? ['--industry', req.industry] : []),
          ],
          {
            cwd: path.resolve(process.cwd(), '..'),  // backend/ 기준
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );

        let buffer = '';
        child.stdout.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf-8');
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              subject.next({ data: JSON.stringify(parsed) });
            } catch {
              subject.next({
                data: JSON.stringify({ type: 'text', text: trimmed }),
              });
            }
          }
        });

        child.stderr.on('data', (chunk: Buffer) => {
          this.logger.debug(`[MCP-stderr] ${chunk.toString('utf-8').trim()}`);
        });

        child.on('close', (code) => {
          if (code !== 0) {
            this.logger.error(`Regional Consultant Agent 비정상 종료: code=${code}`);
            subject.next({
              data: JSON.stringify({
                type: 'error',
                text: `에이전트가 비정상 종료되었습니다 (code: ${code})`,
              }),
            });
          }
          subject.complete();
        });

        child.on('error', (err) => {
          this.logger.error(`Regional Consultant Agent 실행 오류: ${err.message}`);
          subject.next({
            data: JSON.stringify({
              type: 'error',
              text: `에이전트 실행 오류: ${err.message}`,
            }),
          });
          subject.complete();
        });

      } catch (err: any) {
        this.logger.error(`Regional Consultant 오류: ${err.message}`);
        subject.next({
          data: JSON.stringify({
            type: 'error',
            text: `지역 컨설턴트 에이전트 오류: ${err.message}`,
          }),
        });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }
}
