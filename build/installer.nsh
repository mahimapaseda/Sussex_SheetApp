!macro customHeader
  !ifndef BUILD_UNINSTALLER
    Section "-PreserveSheetAppAppData"
      ${if} $installMode == "all"
        SetShellVarContext current
      ${endif}

      ${If} ${FileExists} "$APPDATA\SheetApp\*.*"
        CheckSheetAppRunning:
          nsExec::Exec '"$SYSDIR\cmd.exe" /C tasklist /FI "IMAGENAME eq SheetApp.exe" /NH | "$SYSDIR\findstr.exe" /I "SheetApp.exe"'
          Pop $0
          ${If} $0 == 0
            MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "SheetApp is currently running. Please close SheetApp to continue the installation, then click Retry." /SD IDCANCEL IDRETRY CheckSheetAppRunning
            Abort
          ${EndIf}

        DetailPrint "Backing up existing SheetApp data before upgrade..."
        RMDir /r "$APPDATA\SheetApp_upgrade_backup"
        CreateDirectory "$APPDATA\SheetApp_upgrade_backup"
        CopyFiles /SILENT "$APPDATA\SheetApp\*.*" "$APPDATA\SheetApp_upgrade_backup"
      ${EndIf}

      ${if} $installMode == "all"
        SetShellVarContext all
      ${endif}
    SectionEnd
  !endif
!macroend

!macro customInstall
  ${if} $installMode == "all"
    SetShellVarContext current
  ${endif}

  ; Preserve user data (%APPDATA%\SheetApp: settings.json, sent_log.json, google_token.json, assets).
  ${If} ${FileExists} "$APPDATA\SheetApp_upgrade_backup\*.*"
    ${IfNot} ${FileExists} "$APPDATA\SheetApp\*.*"
      DetailPrint "Restoring SheetApp client data and presets..."
      RMDir /r "$APPDATA\SheetApp"
      Rename "$APPDATA\SheetApp_upgrade_backup" "$APPDATA\SheetApp"
    ${ElseIfNot} ${FileExists} "$APPDATA\SheetApp\settings.json"
      DetailPrint "Restoring SheetApp settings and presets..."
      CopyFiles /SILENT "$APPDATA\SheetApp_upgrade_backup\*.*" "$APPDATA\SheetApp"
      RMDir /r "$APPDATA\SheetApp_upgrade_backup"
    ${Else}
      RMDir /r "$APPDATA\SheetApp_upgrade_backup"
    ${EndIf}
  ${EndIf}

  ${if} $installMode == "all"
    SetShellVarContext all
  ${endif}
!macroend

!macro customUnInstall
  ${if} $installMode == "all"
    SetShellVarContext current
  ${endif}

  ; Preserve %APPDATA%\SheetApp so settings survive upgrades.
  ${if} $installMode == "all"
    SetShellVarContext all
  ${endif}
!macroend
