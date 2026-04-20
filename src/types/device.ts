export interface DeviceLicense {
  Id: number
  DeviceName: string
  CustomerName: string
  ProjectCode: string
  MacAddress: string
  IpAddress: string
  StartTime: string
  EndTime: string | null
  IsEnabled: number
  CreateTime: string
  UpdateTime: string | null
}

export interface DeviceFormData {
  DeviceName: string
  CustomerName: string
  ProjectCode: string
  MacAddress: string
  IpAddress: string
  StartTime: string
  EndTime: string | null
  IsEnabled: number
}

export interface DeviceStats {
  total: number
  enabled: number
  disabled: number
  expiringSoon: number
  expired: number
  permanent: number
}
