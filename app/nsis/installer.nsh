; Halaman "Installer Key" custom — muncul sebelum wizard NSIS melanjutkan.
; Format kunci: XXXX-XXXX-XXXX-XXXX (16 karakter, 4 kotak terpisah).
; Nilai kunci sebenarnya ada di installer-key.nsh (di-generate saat build dari
; INSTALLER_KEY di .env, lihat scripts/generate-installer-key.js).
; installer-key.nsh JANGAN pernah di-commit — sudah di-gitignore.

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"
!include "${PROJECT_DIR}/nsis/installer-key.nsh"

Var InstallKeyDialog
Var InstallKeyBox1
Var InstallKeyBox2
Var InstallKeyBox3
Var InstallKeyBox4
Var InstallKeyErrorLabel

; Deklarasi Page langsung di top-level (bukan di dalam !macro) supaya benar-benar
; diproses SEBELUM assistedInstaller.nsh mendaftarkan halaman Install Mode/Instfiles/
; Finish miliknya sendiri — urutan Page di NSIS mengikuti urutan baris diproses,
; jadi ini wajib berada paling awal supaya jadi halaman PERTAMA di wizard.
Page custom InstallKeyPageCreate InstallKeyPageLeave

Function InstallKeyPageCreate
  nsDialogs::Create 1018
  Pop $InstallKeyDialog
  ${If} $InstallKeyDialog == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 24u "Masukkan Installer Key untuk melanjutkan pemasangan ${PRODUCT_NAME}:"
  Pop $0

  ${NSD_CreateText} 0 30u 38u 14u ""
  Pop $InstallKeyBox1
  SendMessage $InstallKeyBox1 ${EM_SETLIMITTEXT} 4 0
  ${NSD_OnChange} $InstallKeyBox1 OnInstallKeyBox1Change

  ${NSD_CreateLabel} 40u 32u 10u 14u "-"
  Pop $0

  ${NSD_CreateText} 52u 30u 38u 14u ""
  Pop $InstallKeyBox2
  SendMessage $InstallKeyBox2 ${EM_SETLIMITTEXT} 4 0
  ${NSD_OnChange} $InstallKeyBox2 OnInstallKeyBox2Change

  ${NSD_CreateLabel} 92u 32u 10u 14u "-"
  Pop $0

  ${NSD_CreateText} 104u 30u 38u 14u ""
  Pop $InstallKeyBox3
  SendMessage $InstallKeyBox3 ${EM_SETLIMITTEXT} 4 0
  ${NSD_OnChange} $InstallKeyBox3 OnInstallKeyBox3Change

  ${NSD_CreateLabel} 144u 32u 10u 14u "-"
  Pop $0

  ${NSD_CreateText} 156u 30u 38u 14u ""
  Pop $InstallKeyBox4
  SendMessage $InstallKeyBox4 ${EM_SETLIMITTEXT} 4 0

  ${NSD_CreateLabel} 0 55u 100% 30u ""
  Pop $InstallKeyErrorLabel
  SetCtlColors $InstallKeyErrorLabel 0xCC0000 transparent

  ${NSD_SetFocus} $InstallKeyBox1

  nsDialogs::Show
FunctionEnd

Function OnInstallKeyBox1Change
  ${NSD_GetText} $InstallKeyBox1 $0
  StrLen $1 $0
  ${If} $1 >= 4
    ${NSD_SetFocus} $InstallKeyBox2
  ${EndIf}
FunctionEnd

Function OnInstallKeyBox2Change
  ${NSD_GetText} $InstallKeyBox2 $0
  StrLen $1 $0
  ${If} $1 >= 4
    ${NSD_SetFocus} $InstallKeyBox3
  ${EndIf}
FunctionEnd

Function OnInstallKeyBox3Change
  ${NSD_GetText} $InstallKeyBox3 $0
  StrLen $1 $0
  ${If} $1 >= 4
    ${NSD_SetFocus} $InstallKeyBox4
  ${EndIf}
FunctionEnd

Function InstallKeyPageLeave
  ${NSD_GetText} $InstallKeyBox1 $1
  ${NSD_GetText} $InstallKeyBox2 $2
  ${NSD_GetText} $InstallKeyBox3 $3
  ${NSD_GetText} $InstallKeyBox4 $4
  StrCpy $0 "$1-$2-$3-$4"
  ${If} $0 != "${INSTALLER_KEY}"
    SendMessage $InstallKeyErrorLabel ${WM_SETTEXT} 0 "STR:Installer Key salah. Silakan coba lagi."
    Abort
  ${EndIf}
FunctionEnd
