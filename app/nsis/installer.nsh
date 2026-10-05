; Kustomisasi wizard NSIS (installer Windows) STiming System 424:
;   1. Halaman Welcome & Finish berbahasa Indonesia (gambar sidebar/header &
;      ikon diatur di vue.config.js -> nsis.installerSidebar/installerHeader,
;      dibuat oleh scripts/generate-installer-images.py).
;   2. Halaman "Installer Key" — format XXXX-XXXX-XXXX-XXXX (16 karakter,
;      4 kotak). Bisa paste key utuh di kotak pertama (otomatis dipecah),
;      huruf otomatis kapital, tombol Next baru aktif setelah 4 kotak terisi.
;
; Urutan halaman: Welcome -> Installer Key -> Instal -> Finish.
; Nilai kunci sebenarnya ada di installer-key.nsh (di-generate saat build dari
; INSTALLER_KEY di .env, lihat scripts/generate-installer-key.js).
; installer-key.nsh JANGAN pernah di-commit — sudah di-gitignore.
;
; PENTING: electron-builder build NSIS dgn -WX (warning = error). Semua Var/
; Function khusus installer dibungkus !ifndef BUILD_UNINSTALLER supaya tidak
; jadi "not referenced" saat build uninstaller.

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"
!include "LogicLib.nsh"
!include "${PROJECT_DIR}/nsis/installer-key.nsh"

!ifndef BUILD_UNINSTALLER

!ifndef ES_UPPERCASE
  !define ES_UPPERCASE 0x0008
!endif
!ifndef ES_CENTER
  !define ES_CENTER 0x0001
!endif

; ===================== Teks halaman Welcome & Finish =====================
!define MUI_WELCOMEPAGE_TITLE "Selamat Datang di Setup ${PRODUCT_NAME}"
!define MUI_WELCOMEPAGE_TEXT "Wizard ini akan memasang ${PRODUCT_NAME} ${VERSION} di komputer Anda.$\r$\n$\r$\nSiapkan Installer Key dari administrator — key akan diminta di langkah berikutnya.$\r$\n$\r$\nTutup aplikasi ${PRODUCT_NAME} yang sedang berjalan, lalu klik Next untuk melanjutkan."
!define MUI_FINISHPAGE_TITLE "Pemasangan Selesai"
!define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} berhasil dipasang di komputer Anda.$\r$\n$\r$\nKlik Finish untuk menutup wizard ini."
!define MUI_FINISHPAGE_RUN_TEXT "Jalankan ${PRODUCT_NAME} sekarang"

Var InstallKeyDialog
Var InstallKeyBox1
Var InstallKeyBox2
Var InstallKeyBox3
Var InstallKeyBox4
Var InstallKeyErrorLabel
Var InstallKeyFont
Var InstallKeyLabelFont
Var InstallKeyBusy
Var InstallKeyRaw
Var InstallKeyP1
Var InstallKeyP2
Var InstallKeyP3
Var InstallKeyP4

; Disisipkan electron-builder (assistedInstaller.nsh) sebagai halaman PERTAMA,
; sebelum halaman Instal — Welcome dulu, baru Installer Key.
!macro customWelcomePage
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW InstallWelcomeShow
  !insertmacro MUI_PAGE_WELCOME
  Page custom InstallKeyPageCreate InstallKeyPageLeave
!macroend

; Tombol Next dinonaktifkan di halaman Installer Key selama key belum lengkap
; — kalau operator klik Back ke Welcome, nyalakan lagi (state tombol dibawa
; antar halaman).
Function InstallWelcomeShow
  GetDlgItem $0 $HWNDPARENT 1
  EnableWindow $0 1
FunctionEnd

Function InstallKeyPageCreate
  !insertmacro MUI_HEADER_TEXT "Aktivasi Installer" "Masukkan Installer Key untuk melanjutkan pemasangan ${PRODUCT_NAME}."

  nsDialogs::Create 1018
  Pop $InstallKeyDialog
  ${If} $InstallKeyDialog == error
    Abort
  ${EndIf}

  StrCpy $InstallKeyBusy 0
  CreateFont $InstallKeyFont "Consolas" 15 700
  CreateFont $InstallKeyLabelFont "$(^Font)" 9 700

  ${NSD_CreateLabel} 0 0 100% 11u "Installer Key"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $InstallKeyLabelFont 1

  ${NSD_CreateLabel} 0 12u 100% 20u "Masukkan 16 karakter dgn format XXXX-XXXX-XXXX-XXXX. Anda juga bisa menempel (paste) key utuh di kotak pertama."
  Pop $0

  ; 4 kotak (lebar 54u, tinggi 20u) dipisah tanda "-"; teks rata tengah &
  ; otomatis kapital. Kotak 1 boleh 19 karakter supaya paste key utuh muat.
  nsDialogs::CreateControl EDIT ${DEFAULT_STYLES}|${WS_TABSTOP}|${ES_AUTOHSCROLL}|${ES_CENTER}|${ES_UPPERCASE} ${WS_EX_WINDOWEDGE}|${WS_EX_CLIENTEDGE} 0 40u 54u 20u ""
  Pop $InstallKeyBox1
  SendMessage $InstallKeyBox1 ${WM_SETFONT} $InstallKeyFont 1
  SendMessage $InstallKeyBox1 ${EM_SETLIMITTEXT} 19 0
  ${NSD_OnChange} $InstallKeyBox1 OnInstallKeyBox1Change

  ${NSD_CreateLabel} 56u 43u 10u 14u "-"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $InstallKeyFont 1

  nsDialogs::CreateControl EDIT ${DEFAULT_STYLES}|${WS_TABSTOP}|${ES_AUTOHSCROLL}|${ES_CENTER}|${ES_UPPERCASE} ${WS_EX_WINDOWEDGE}|${WS_EX_CLIENTEDGE} 68u 40u 54u 20u ""
  Pop $InstallKeyBox2
  SendMessage $InstallKeyBox2 ${WM_SETFONT} $InstallKeyFont 1
  SendMessage $InstallKeyBox2 ${EM_SETLIMITTEXT} 4 0
  ${NSD_OnChange} $InstallKeyBox2 OnInstallKeyBox2Change

  ${NSD_CreateLabel} 124u 43u 10u 14u "-"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $InstallKeyFont 1

  nsDialogs::CreateControl EDIT ${DEFAULT_STYLES}|${WS_TABSTOP}|${ES_AUTOHSCROLL}|${ES_CENTER}|${ES_UPPERCASE} ${WS_EX_WINDOWEDGE}|${WS_EX_CLIENTEDGE} 136u 40u 54u 20u ""
  Pop $InstallKeyBox3
  SendMessage $InstallKeyBox3 ${WM_SETFONT} $InstallKeyFont 1
  SendMessage $InstallKeyBox3 ${EM_SETLIMITTEXT} 4 0
  ${NSD_OnChange} $InstallKeyBox3 OnInstallKeyBox3Change

  ${NSD_CreateLabel} 192u 43u 10u 14u "-"
  Pop $0
  SendMessage $0 ${WM_SETFONT} $InstallKeyFont 1

  nsDialogs::CreateControl EDIT ${DEFAULT_STYLES}|${WS_TABSTOP}|${ES_AUTOHSCROLL}|${ES_CENTER}|${ES_UPPERCASE} ${WS_EX_WINDOWEDGE}|${WS_EX_CLIENTEDGE} 204u 40u 54u 20u ""
  Pop $InstallKeyBox4
  SendMessage $InstallKeyBox4 ${WM_SETFONT} $InstallKeyFont 1
  SendMessage $InstallKeyBox4 ${EM_SETLIMITTEXT} 4 0
  ${NSD_OnChange} $InstallKeyBox4 OnInstallKeyBox4Change

  ; Pesan error (merah)
  ${NSD_CreateLabel} 0 68u 100% 14u ""
  Pop $InstallKeyErrorLabel
  SetCtlColors $InstallKeyErrorLabel 0xCC0000 transparent

  ; Bantuan
  ${NSD_CreateLabel} 0 92u 100% 30u "Belum punya Installer Key? Hubungi administrator atau Technical Support (jendelacakradigital@gmail.com). Huruf besar/kecil tidak berpengaruh."
  Pop $0
  SetCtlColors $0 0x64748B transparent

  ${NSD_SetFocus} $InstallKeyBox1
  Call InstallKeyValidate

  nsDialogs::Show
FunctionEnd

; Buang "-" dan spasi dari $InstallKeyRaw (hasil tetap di $InstallKeyRaw).
Function InstallKeyCleanup
  StrCpy $R1 ""
  StrCpy $R2 0
  cleanLoop:
    StrCpy $R3 $InstallKeyRaw 1 $R2
    StrCmp $R3 "" cleanDone
    StrCmp $R3 "-" cleanNext
    StrCmp $R3 " " cleanNext
    StrCpy $R1 "$R1$R3"
  cleanNext:
    IntOp $R2 $R2 + 1
    Goto cleanLoop
  cleanDone:
  StrCpy $InstallKeyRaw $R1
FunctionEnd

; Pecah $InstallKeyRaw (tanpa "-") ke 4 kotak. Pakai Var khusus (bukan
; $0-$9) + flag $InstallKeyBusy krn NSD_SetText memicu OnChange kotak lain.
Function InstallKeyDistribute
  StrCpy $InstallKeyBusy 1
  StrCpy $InstallKeyP1 $InstallKeyRaw 4 0
  StrCpy $InstallKeyP2 $InstallKeyRaw 4 4
  StrCpy $InstallKeyP3 $InstallKeyRaw 4 8
  StrCpy $InstallKeyP4 $InstallKeyRaw 4 12
  ${NSD_SetText} $InstallKeyBox1 $InstallKeyP1
  ${NSD_SetText} $InstallKeyBox2 $InstallKeyP2
  ${NSD_SetText} $InstallKeyBox3 $InstallKeyP3
  ${NSD_SetText} $InstallKeyBox4 $InstallKeyP4
  StrCpy $InstallKeyBusy 0
  ${NSD_SetFocus} $InstallKeyBox4
FunctionEnd

; Next aktif hanya kalau 4 kotak masing2 berisi 4 karakter; sekaligus bersihkan
; pesan error lama begitu operator mengubah isian.
Function InstallKeyValidate
  StrCpy $R5 1
  ${NSD_GetText} $InstallKeyBox1 $R6
  StrLen $R7 $R6
  ${If} $R7 != 4
    StrCpy $R5 0
  ${EndIf}
  ${NSD_GetText} $InstallKeyBox2 $R6
  StrLen $R7 $R6
  ${If} $R7 != 4
    StrCpy $R5 0
  ${EndIf}
  ${NSD_GetText} $InstallKeyBox3 $R6
  StrLen $R7 $R6
  ${If} $R7 != 4
    StrCpy $R5 0
  ${EndIf}
  ${NSD_GetText} $InstallKeyBox4 $R6
  StrLen $R7 $R6
  ${If} $R7 != 4
    StrCpy $R5 0
  ${EndIf}
  GetDlgItem $R8 $HWNDPARENT 1
  EnableWindow $R8 $R5
FunctionEnd

Function OnInstallKeyBox1Change
  ${If} $InstallKeyBusy == 1
    Return
  ${EndIf}
  SendMessage $InstallKeyErrorLabel ${WM_SETTEXT} 0 "STR:"
  ${NSD_GetText} $InstallKeyBox1 $InstallKeyRaw
  Call InstallKeyCleanup
  StrLen $R4 $InstallKeyRaw
  ${If} $R4 > 4
    Call InstallKeyDistribute
  ${ElseIf} $R4 == 4
    ${NSD_SetFocus} $InstallKeyBox2
  ${EndIf}
  Call InstallKeyValidate
FunctionEnd

Function OnInstallKeyBox2Change
  ${If} $InstallKeyBusy == 1
    Return
  ${EndIf}
  SendMessage $InstallKeyErrorLabel ${WM_SETTEXT} 0 "STR:"
  ${NSD_GetText} $InstallKeyBox2 $R4
  StrLen $R4 $R4
  ${If} $R4 >= 4
    ${NSD_SetFocus} $InstallKeyBox3
  ${EndIf}
  Call InstallKeyValidate
FunctionEnd

Function OnInstallKeyBox3Change
  ${If} $InstallKeyBusy == 1
    Return
  ${EndIf}
  SendMessage $InstallKeyErrorLabel ${WM_SETTEXT} 0 "STR:"
  ${NSD_GetText} $InstallKeyBox3 $R4
  StrLen $R4 $R4
  ${If} $R4 >= 4
    ${NSD_SetFocus} $InstallKeyBox4
  ${EndIf}
  Call InstallKeyValidate
FunctionEnd

Function OnInstallKeyBox4Change
  ${If} $InstallKeyBusy == 1
    Return
  ${EndIf}
  SendMessage $InstallKeyErrorLabel ${WM_SETTEXT} 0 "STR:"
  Call InstallKeyValidate
FunctionEnd

Function InstallKeyPageLeave
  ${NSD_GetText} $InstallKeyBox1 $1
  ${NSD_GetText} $InstallKeyBox2 $2
  ${NSD_GetText} $InstallKeyBox3 $3
  ${NSD_GetText} $InstallKeyBox4 $4
  StrCpy $0 "$1-$2-$3-$4"
  ; Perbandingan LogicLib (StrCmp) tidak membedakan huruf besar/kecil.
  ${If} $0 != "${INSTALLER_KEY}"
    SendMessage $InstallKeyErrorLabel ${WM_SETTEXT} 0 "STR:Installer Key salah. Periksa kembali lalu coba lagi."
    ${NSD_SetFocus} $InstallKeyBox1
    Abort
  ${EndIf}
FunctionEnd

!endif ; BUILD_UNINSTALLER

; ===================== Teks wizard Uninstaller =====================
; Halaman uninstaller (Welcome -> Uninstall -> Finish) disusun
; assistedInstaller.nsh electron-builder; di sini cuma teksnya.
!ifdef BUILD_UNINSTALLER
!define MUI_UNWELCOMEPAGE_TITLE "Hapus ${PRODUCT_NAME}"
!define MUI_UNWELCOMEPAGE_TEXT "Wizard ini akan menghapus ${PRODUCT_NAME} ${VERSION} dari komputer Anda.$\r$\n$\r$\nData event & hasil lomba tersimpan di database, sehingga tidak ikut terhapus.$\r$\n$\r$\nTutup aplikasi ${PRODUCT_NAME} yang sedang berjalan, lalu klik Next untuk melanjutkan."
!define MUI_UNFINISHPAGE_TITLE "Penghapusan Selesai"
!define MUI_UNFINISHPAGE_TEXT "${PRODUCT_NAME} telah dihapus dari komputer Anda.$\r$\n$\r$\nKlik Finish untuk menutup wizard ini."
!endif ; BUILD_UNINSTALLER
