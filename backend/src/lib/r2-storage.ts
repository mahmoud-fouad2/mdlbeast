// This file is deprecated. Please use services/storageService instead.
// Redirecting exports to the new service for compatibility.
import { storageService } from '../services/storageService'

export const uploadBuffer = storageService.uploadBuffer.bind(storageService)
export const getPublicUrl = storageService.getPublicUrl.bind(storageService)
export const getSignedDownloadUrl = storageService.getSignedDownloadUrl.bind(storageService)
export const downloadToBuffer = storageService.downloadToBuffer.bind(storageService)
export const deleteObject = storageService.deleteObject.bind(storageService)



