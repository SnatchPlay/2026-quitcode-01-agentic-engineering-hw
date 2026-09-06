'use client';

import { PFlyout, PHeading, PInputNumber, PSwitch, PText } from '@/pds';
import { useSettingsStore } from '@/store/settingsStore';

interface SettingsFlyoutProps {
  open: boolean;
  onDismiss: () => void;
}

export function SettingsFlyout({ open, onDismiss }: SettingsFlyoutProps) {
  const {
    das,
    arr,
    reducedEffects,
    colorBlindMode,
    setDas,
    setArr,
    setReducedEffects,
    setColorBlindMode,
  } = useSettingsStore((s) => s);

  return (
    <PFlyout open={open} onDismiss={onDismiss} position="end" aria={{ 'aria-label': 'Налаштування' }}>
      <PHeading size="md" tag="h2" slot="header">
        Налаштування керування
      </PHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
        <PText size="xs" color="contrast-medium">
          DAS/ARR визначають, як швидко фігура рухається при утриманні клавіші — саме тут
          «відчувається» різниця між аркадним і спортивним керуванням.
        </PText>
        <PInputNumber
          name="das"
          label="DAS — затримка авто-повтору (мс)"
          min={0}
          max={300}
          step={1}
          value={das}
          onChange={(e) => setDas(Number((e.target as HTMLInputElement).value))}
        />
        <PInputNumber
          name="arr"
          label="ARR — швидкість авто-повтору (мс)"
          min={0}
          max={100}
          step={1}
          value={arr}
          onChange={(e) => setArr(Number((e.target as HTMLInputElement).value))}
        />
        <PSwitch checked={colorBlindMode} onUpdate={(e) => setColorBlindMode(e.detail.checked)}>
          Режим для дальтоніків (літери на фігурах)
        </PSwitch>
        <PSwitch checked={reducedEffects} onUpdate={(e) => setReducedEffects(e.detail.checked)}>
          Зменшити ефекти (частинки, тряска екрана)
        </PSwitch>
      </div>
    </PFlyout>
  );
}
