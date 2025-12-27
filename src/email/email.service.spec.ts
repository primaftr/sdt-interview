import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService();

    // Mock AbortController for Node/Jest compatibility
    (global as any).AbortController = class {
      signal: any;
      constructor() {
        this.signal = {};
      }
      abort() {}
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error mock global override
    delete global.AbortController;
  });

  it('sends email when API returns ok', async () => {
    const mockFetch = jest
      .spyOn(global as any, 'fetch')
      .mockResolvedValue({ ok: true });

    await expect(service.send('a@b.com', 'hello')).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/send-email');
    expect((opts as any).method).toBe('POST');
    const body = JSON.parse((opts as any).body as string);
    expect(body).toEqual({ email: 'a@b.com', message: 'hello' });
  });

  it('throws when API returns non-ok', async () => {
    jest
      .spyOn(global as any, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 });

    await expect(service.send('x@y.com', 'msg')).rejects.toThrow(
      /Email API error/,
    );
  });

  it('uses AbortController timeout (simulated)', async () => {
    global.AbortController = class {
      signal: any;
      constructor() {
        this.signal = {};
      }
      abort() {}
    };

    const fetchMock = jest
      .spyOn(global as any, 'fetch')
      .mockImplementation(async (_url: string, opts: any) => {
        expect(opts).toHaveProperty('signal');
        return { ok: true };
      });

    await expect(service.send('test@x.com', 'hi')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
  });
});
