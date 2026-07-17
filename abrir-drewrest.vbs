' Abre DrewRest.exe (acceso directo / doble clic silencioso).
Option Explicit

Dim fso, shell, root, exe

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
exe = root & "\DrewRest.exe"

If Not fso.FileExists(exe) Then
  MsgBox "No se encuentra DrewRest.exe en:" & vbCrLf & root & vbCrLf & vbCrLf & _
    "Vuelve a empaquetar o copia el ejecutable a esta carpeta.", vbCritical, "DrewRest"
  WScript.Quit 1
End If

shell.Run """" & exe & """", 1, False
WScript.Quit 0
