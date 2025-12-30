// 백업/복원 Custom Hook
import { useMutation } from '@tanstack/react-query';
import { createAndDownloadBackup, readBackupFile, restoreBackupData } from '../../data/repository/backupRepository';
import type { BackupData, RestoreOptions } from '../../core/types';

/**
 * 백업 생성 Hook
 */
export const useCreateBackup = () => {
  return useMutation({
    mutationFn: async () => {
      await createAndDownloadBackup();
    },
  });
};

/**
 * 백업 파일 읽기 Hook
 */
export const useReadBackupFile = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<BackupData> => {
      return await readBackupFile(file);
    },
  });
};

/**
 * 백업 복원 Hook
 */
export const useRestoreBackup = () => {
  return useMutation({
    mutationFn: async ({ backup, options }: { backup: BackupData; options: RestoreOptions }) => {
      await restoreBackupData(backup, options);
    },
  });
};
