using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using OpenTK.Audio.OpenAL;
using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;
using OpenTK.Windowing.Desktop;
using OpenTK.Windowing.GraphicsLibraryFramework;

namespace ComputerGraphics_lab3
{
    public class View : GameWindow
    {
        int BasicProgramID; // дескриптор объекта программы
        int BasicVertexShader; // дескриптор вершинного шейдера
        int BasicFragmentShader; // дескриптор фрагментного шейдера
        
        float width, height; // ширина и высота окна

        public List<Vector3> vertices = new List<Vector3>()
        {
            new Vector3( -1f, 1f, -1f),
            new Vector3( 1f, 1f, -1f),
            new Vector3( 1f, -1f, -1f),
            new Vector3( -1f, -1f, -1f)
        }; // массив вершин для квадрата

        public uint[] indices =
        {
            0, 1, 2,
            2, 3, 0
        }; // индексы вершин (порядок отрисовки)

        public int VAO; // объект массива вершин (дескриптор)   
        public int VBO; // объект буфера вершин (дескриптор)
        public int EBO; // объект буфера элементов (дескриптор)

        public View(float width, float height) : base(GameWindowSettings.Default, NativeWindowSettings.Default)
        {
            CenterWindow(new Vector2i((int)width, (int)height)); // центрирование окна
            this.width = width;
            this.height = height;
        }

        protected override void OnResize(ResizeEventArgs e)
        {
            base.OnResize(e);
            GL.Viewport(0, 0, e.Width, e.Height);
            this.width = e.Width;
            this.height = e.Height;
        }

        void LoadShader(String filename, ShaderType type, int program, out int address) // загрузка шейдеров
        {
            address = GL.CreateShader(type); // Создание объекта шейдера типа type (возвращается дескриптор)
            using (System.IO.StreamReader sr = new StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd()); // загрузка исходного кода из файла в шейдерный объект
            }
            GL.CompileShader(address); // компиляция исходного шейдера (указываем его дескриптор)
            GL.AttachShader(program, address); // компоновка шейдерной программы

            Console.WriteLine(GL.GetShaderInfoLog(address));
        }

        void InitShaders() // инициализация шейдерного окна
        {
            BasicProgramID = GL.CreateProgram(); // создание объекта программы

            // загрузка шейдеров
            LoadShader("../../../Shaders/raytracing.vert", ShaderType.VertexShader, BasicProgramID, out BasicVertexShader);
            LoadShader("../../../Shaders/raytracing.frag", ShaderType.FragmentShader, BasicProgramID, out BasicFragmentShader);

            GL.LinkProgram(BasicProgramID); // линковка объекта программы

            // проверяем успех компоновки
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status); // запрашивает статус линковки
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }

        protected override void OnLoad()
        {
            base.OnLoad();

            VAO = GL.GenVertexArray(); // Генерация нового идентификатора VAO
            GL.BindVertexArray(VAO); // Привязка созданного VAO как активного

            VBO = GL.GenBuffer(); // Генерация нового идентификатора буфера
            GL.BindBuffer(BufferTarget.ArrayBuffer, VBO); // Привязка буфера к точке ArrayBuffer 

            // Заполнение буфера данными
            GL.BufferData(
                BufferTarget.ArrayBuffer,        // Целевой буфер
                vertices.Count * Vector3.SizeInBytes, // Размер данных в байтах
                vertices.ToArray(),               // Массив данных вершин
                BufferUsageHint.StaticDraw        // Указание, что данные не будут меняться (оптимизация)
            );
            // Настройка указателя атрибутов вершин (как интерпретировать данные)
            GL.VertexAttribPointer(
                0,                          // Индекс атрибута (layout location = 0 в шейдере)
                3,                          // Количество компонентов (x, y, z = 3)
                VertexAttribPointerType.Float, // Тип данных (float)
                false,                      // Не нормализовать
                0,                          // Stride (расстояние между вершинами в байтах, 0 = плотная упаковка)
                0                           // Смещение первого компонента от начала
            );

            GL.EnableVertexAttribArray(0); // Активация атрибута с индексом 0
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0); // Отвязка буфера вершин

            EBO = GL.GenBuffer(); // Генерация нового идентификатора буфера
            GL.BindBuffer(BufferTarget.ElementArrayBuffer, EBO); // Привязка буфера к точке ElementArrayBuffer

            // Заполнение буфера данными индексов
            GL.BufferData(
                BufferTarget.ElementArrayBuffer, // Целевой буфер
                indices.Length * sizeof(uint),   // Размер данных в байтах
                indices,                         // Массив индексов
                BufferUsageHint.StaticDraw       // Указание, что данные не будут меняться
            );

            GL.BindBuffer(BufferTarget.ElementArrayBuffer, 0); // Отвязка буфера индексов

            InitShaders();
        }

        protected override void OnRenderFrame(FrameEventArgs args)
        {
            // Установка цвета фона и очистка буфера цвета
            GL.ClearColor(0.1f, 0.3f, 0.8f, 0.5f); // Установка синего фона с прозрачностью
            GL.Clear(ClearBufferMask.ColorBufferBit); // Очистка буфера цвета

            GL.UseProgram(BasicProgramID); // Активация шейдерной программы

            // Привязка объектов для рендеринга
            GL.BindVertexArray(VAO); // Привязка VAO, содержещего настройки вершин
            GL.BindBuffer(BufferTarget.ElementArrayBuffer, EBO); // Привязка буфера индексов

            // Выполнение рендеринга
            GL.DrawElements(
                PrimitiveType.Triangles,     // Тип примитивов для отрисовки (треугольники)
                indices.Length,              // Количество индексов
                DrawElementsType.UnsignedInt, // Тип индексов (uint)
                0                            // Смещение от начала буфера
            );

            Context.SwapBuffers(); // Обмен буферов
            base.OnRenderFrame(args);
        }

        protected override void OnUpdateFrame(FrameEventArgs args)
        {
            base.OnUpdateFrame(args);
        }
    }
}
