#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shellapi.h>
#include <shlwapi.h>
#include <stdio.h>
#include <wchar.h>

static BOOL FileExists(const wchar_t *path) {
    DWORD attr = GetFileAttributesW(path);
    return (attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY));
}

static BOOL FindPython(const wchar_t *baseDir, wchar_t *outPath, size_t outSize) {
    // 1. Check bundled runtime/pythonw.exe or runtime/python.exe
    _snwprintf(outPath, outSize, L"%s\\runtime\\pythonw.exe", baseDir);
    if (FileExists(outPath)) return TRUE;

    _snwprintf(outPath, outSize, L"%s\\runtime\\python.exe", baseDir);
    if (FileExists(outPath)) return TRUE;

    // 2. Check local pythonw.exe or python.exe in baseDir
    _snwprintf(outPath, outSize, L"%s\\pythonw.exe", baseDir);
    if (FileExists(outPath)) return TRUE;

    _snwprintf(outPath, outSize, L"%s\\python.exe", baseDir);
    if (FileExists(outPath)) return TRUE;

    // 3. Search in system PATH for pythonw.exe
    if (SearchPathW(NULL, L"pythonw.exe", NULL, (DWORD)outSize, outPath, NULL) > 0) {
        if (FileExists(outPath)) return TRUE;
    }

    // 4. Search in system PATH for python.exe
    if (SearchPathW(NULL, L"python.exe", NULL, (DWORD)outSize, outPath, NULL) > 0) {
        if (FileExists(outPath)) return TRUE;
    }

    // 5. Search in system PATH for py.exe (Python Launcher)
    if (SearchPathW(NULL, L"py.exe", NULL, (DWORD)outSize, outPath, NULL) > 0) {
        if (FileExists(outPath)) return TRUE;
    }

    return FALSE;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    wchar_t exePath[MAX_PATH];
    GetModuleFileNameW(NULL, exePath, MAX_PATH);

    // Extract directory
    wchar_t baseDir[MAX_PATH];
    wcsncpy(baseDir, exePath, MAX_PATH);
    wchar_t *lastSlash = wcsrchr(baseDir, L'\\');
    if (lastSlash) {
        *lastSlash = L'\0';
    } else {
        wcscpy(baseDir, L".");
    }

    // Set current working directory to the app directory
    SetCurrentDirectoryW(baseDir);

    // Target script
    wchar_t scriptPath[MAX_PATH];
    _snwprintf(scriptPath, MAX_PATH, L"%s\\desktop_app.py", baseDir);
    if (!FileExists(scriptPath)) {
        // Fallback to app.py
        _snwprintf(scriptPath, MAX_PATH, L"%s\\app.py", baseDir);
    }

    wchar_t pythonExe[MAX_PATH] = {0};
    if (!FindPython(baseDir, pythonExe, MAX_PATH)) {
        int choice = MessageBoxW(
            NULL,
            L"Music Studio requires Python 3.8 or higher on Windows.\n\n"
            L"Python was not detected on this system.\n\n"
            L"Would you like to open the official Python download page?",
            L"Music Studio — Python Required",
            MB_ICONQUESTION | MB_YESNO
        );
        if (choice == IDYES) {
            ShellExecuteW(NULL, L"open", L"https://www.python.org/downloads/windows/", NULL, NULL, SW_SHOWNORMAL);
        }
        return 1;
    }

    // Prepare command line: "<python>" "<script>"
    wchar_t cmdLine[MAX_PATH * 3];
    _snwprintf(cmdLine, sizeof(cmdLine) / sizeof(wchar_t), L"\"%s\" \"%s\"", pythonExe, scriptPath);

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    // Spawn windowlessly
    DWORD flags = CREATE_NO_WINDOW;
    BOOL success = CreateProcessW(
        NULL,
        cmdLine,
        NULL,
        NULL,
        FALSE,
        flags,
        NULL,
        baseDir,
        &si,
        &pi
    );

    if (!success) {
        wchar_t errMsg[512];
        _snwprintf(errMsg, 512, L"Failed to launch Music Studio.\nError code: %lu\nCommand: %s", GetLastError(), cmdLine);
        MessageBoxW(NULL, errMsg, L"Music Studio Error", MB_ICONERROR | MB_OK);
        return 1;
    }

    // Close handles; let the application run independently
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return 0;
}
