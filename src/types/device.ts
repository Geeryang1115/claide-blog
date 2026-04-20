export interface DeviceLicense {
  Id: number
  DeviceName: string
  MacAddress: string
  IpAddress: string
  StartTime: string
  EndTime: string
  IsEnabled: number
  CreateTime: string
  UpdateTime: string | null
}

export interface DeviceFormData {
  DeviceName: string
  MacAddress: string
  IpAddress: string
  StartTime: string
  EndTime: string
  IsEnabled: number
}
