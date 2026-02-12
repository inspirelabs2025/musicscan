import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export class OfflineMusicDB {
  static async cacheAlbumData(albumId: string, data: any) {
    if (!Capacitor.isNativePlatform()) return;
    
    await Filesystem.writeFile({
      path: `music-cache/${albumId}.json`,
      data: JSON.stringify(data),
      directory: Directory.Data
    });
  }
  
  static async getCachedAlbum(albumId: string) {
    try {
      const result = await Filesystem.readFile({
        path: `music-cache/${albumId}.json`,
        directory: Directory.Data
      });
      
      return JSON.parse(result.data as string);
    } catch {
      return null;
    }
  }
}