import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { spawn } from 'child_process';
import * as path from 'path';

export interface MarketResearchRequest {
  query: string;
  target_market?: string;
  industry?: string;
}

@Injectable()
export class MarketResearchService {
  private readonly logger = new Logger(MarketResearchService.name);

  // 프로젝트 루트 기준 경로
  private readonly VENV_PYTHON = path.resolve(
    process.cwd(),
    'mcp/venv/Scripts/python.exe',
  );
  private readonly AGENT_SCRIPT = path.resolve(
    process.cwd(),
    'mcp/agents/market_research_agent.py',
  );

  /**
   * Market Research Agent를 Python 자식 프로세스로 실행하여
   * SSE 스트림으로 결과를 실시간 전달합니다.
   */
  runMarketResearch(req: MarketResearchRequest): Observable<any> {
    const subject = new Subject<any>();

    (async () => {
      try {
        subject.next({
          data: JSON.stringify({
            type: 'status',
            text: '시장조사 에이전트 시작 중...',
          }),
        });

        this.logger.log(
          `Market Research Agent 실행: query="${req.query}" market="${req.target_market || '-'}" industry="${req.industry || '-'}"`,
        );

        // Python MCP 에이전트 자식 프로세스 실행
        const child = spawn(
          this.VENV_PYTHON,
          [
            this.AGENT_SCRIPT,
            '--query', req.query,
            ...(req.target_market ? ['--target_market', req.target_market] : []),
            ...(req.industry ? ['--industry', req.industry] : []),
          ],
          {
            cwd: path.resolve(process.cwd(), '..'),  // backend/ 기준
            env: { ...process.env },
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );

        // stdout: JSON 라인별 파싱 후 SSE 전달
        let buffer = '';
        child.stdout.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf-8');
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';  // 마지막 불완전 라인 보관

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              subject.next({ data: JSON.stringify(parsed) });
            } catch {
              // JSON이 아닌 출력은 텍스트로 전달
              subject.next({
                data: JSON.stringify({ type: 'text', text: trimmed }),
              });
            }
          }
        });

        // stderr: 로그로만 기록
        child.stderr.on('data', (chunk: Buffer) => {
          this.logger.debug(`[MCP-stderr] ${chunk.toString('utf-8').trim()}`);
        });

        // 프로세스 종료
        child.on('close', (code) => {
          if (code !== 0) {
            this.logger.error(`Market Research Agent 비정상 종료: code=${code}`);
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
          this.logger.error(`Market Research Agent 실행 오류: ${err.message}`);
          subject.next({
            data: JSON.stringify({
              type: 'error',
              text: `에이전트 실행 오류: ${err.message}\n\nPython venv 경로를 확인해주세요: ${this.VENV_PYTHON}`,
            }),
          });
          subject.complete();
        });

      } catch (err: any) {
        this.logger.error(`Market Research 오류: ${err.message}`);
        subject.next({
          data: JSON.stringify({
            type: 'error',
            text: `시장조사 에이전트 오류: ${err.message}`,
          }),
        });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }
}
