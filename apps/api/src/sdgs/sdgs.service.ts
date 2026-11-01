import type { SdgRepository } from '../data/repositories';

export class SdgsService {
  constructor(private readonly sdgs: SdgRepository) {}

  async listSDGs() {
    return this.sdgs.listSDGs();
  }

  async findSDGByNumber(number: number) {
    return this.sdgs.findSDGByNumber(number);
  }

  async listTargetsBySdgId(sdgId: string) {
    return this.sdgs.listTargetsBySdgId(sdgId);
  }

  async listIndicatorsBySdgId(sdgId: string) {
    return this.sdgs.listIndicatorsBySdgId(sdgId);
  }
}