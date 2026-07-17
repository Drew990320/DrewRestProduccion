' Crea iconos DrewRest en el escritorio.
Option Explicit

Dim fso, shell, root, ps1, cmd, code

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = root & "\scripts\crear-accesos-directos.ps1"

If Not fso.FileExists(ps1) Then
  MsgBox "No se encuentra scripts\crear-accesos-directos.ps1" & vbCrLf & vbCrLf & _
    "Vuelve a empaquetar DrewRest o copia la carpeta scripts\ completa.", vbCritical, "DrewRest"
  WScript.Quit 1
End If

cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & ps1 & """"
code = shell.Run(cmd, 1, True)

If code <> 0 Then
  MsgBox "No se pudieron crear los accesos directos (codigo " & code & ").", vbCritical, "DrewRest"
  WScript.Quit code
End If

MsgBox "Accesos directos creados en el escritorio." & vbCrLf & vbCrLf & _
  "Usa el icono ""DrewRest"" para abrir la app.", vbInformation, "DrewRest"
