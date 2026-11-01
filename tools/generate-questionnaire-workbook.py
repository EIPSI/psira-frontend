"""Build the downloadable PSIRA guide with only Python's standard library.
The survey/choices/settings sheets form an uploadable questionnaire; other sheets document it.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED
from questionnaire_workbook_locales import LANGS, EXAMPLE_TITLE, localize_sheets, test_checklist

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'src/assets/templates/PSIRA-cuestionarios-guia.xlsx'
EXAMPLE_OUTPUT = OUTPUT.with_name('PSIRA-cuestionario-ejemplo-completo.xlsx')
COLUMNS = ['type', 'name', 'label', 'hint', 'required', 'required_message', 'appearance', 'page_break_before', 'min_length', 'max_length',
           'relevant', 'image', 'range_min', 'range_max', 'range_step', 'range_label_list', 'range_min_label',
           'range_max_label', 'range_labels_position', 'range_value_position', 'range_label_size', 'range_value_size',
           'range_labels_boxed', 'range_labels_bold', 'range_gradient', 'range_color_start', 'range_color_end',
           'constraint', 'constraint_message', 'calculation', 'default', 'choice_filter']
rows = []
def question(type_, name, label, **kwargs):
    row = dict(type=type_, name=name, label=label, **kwargs)
    rows.append([row.get(key, '') for key in COLUMNS])
def group(name, label, appearance='', page_break_before=False):
    question('begin_group', name, label, appearance=appearance, page_break_before=page_break_before)
def end():
    question('end_group', '', '')

group('basicos', 'Tipos básicos y condiciones')
question('note', 'instrucciones', 'Este cuestionario es una demostración. Editá una copia; conservá los nombres de las hojas técnicas.')
question('text', 'comentario', '¿Qué te gustaría contarnos?', hint='Máximo 250 caracteres.', max_length=250,
         required=True, required_message='Escribí tu comentario para continuar.')
question('integer', 'dias', '¿Cuántos días hiciste actividad física?', hint='Número entero.', max_length=7)
question('decimal', 'horas', '¿Cuántas horas dormiste?', hint='Admite decimales.')
question('date', 'fecha', 'Fecha de referencia')
question('time', 'hora', 'Hora de referencia')
question('date_time', 'fecha_hora', 'Fecha y hora de referencia')
question('checkbox', 'confirmacion', 'Confirmo que leí las instrucciones', hint='Una casilla; marcar y desmarcar guarda verdadero o falso.')
question('select_one si_no', 'actividad', '¿Realizaste alguna actividad?', required=True)
question('text', 'detalle_actividad', '¿Qué actividad realizaste?', relevant="${actividad} = 'si'", max_length=100)
question('select_multiple sintomas', 'sintomas', 'Seleccioná entre uno y dos síntomas', appearance='cards', min_length=1, max_length=2)
question('note', 'condicion_numero', 'Esta nota aparece cuando días es mayor que tres.', relevant='${dias} > 3')
question('text', 'detalle_dolor', 'Describí el dolor seleccionado', relevant="selected(${sintomas}, 'dolor')")
question('note', 'condicion_combinada', 'Actividad confirmada y más de tres días.', relevant="${actividad} = 'si' and ${dias} > 3")
question('note', 'imagen_ejemplo', 'También podés incluir imágenes en las preguntas.', image='assets/templates/psira-example.svg')
end()
group('opciones', 'Opciones y apariencias', page_break_before=True)
question('select_one satisfaccion', 'satisfaccion_lista', 'Respuesta única habitual', hint='El valor guardado es choices.name.')
question('select_one satisfaccion', 'satisfaccion_tarjetas', 'Respuesta única con tarjetas', appearance='cards')
question('select_one satisfaccion', 'satisfaccion_likert', 'Escala Likert individual', appearance='likert')
question('select_multiple sintomas', 'sintomas_lista', 'Respuesta múltiple habitual')
question('select_one imagenes', 'imagen_opcion', 'Opciones con imágenes', appearance='cards')
end()
group('matriz', 'Matriz Likert', 'likert-matrix')
question('select_one frecuencia', 'energia', 'Tuve energía', required=True)
question('select_one frecuencia', 'concentracion', 'Pude concentrarme', hint='Considerá la última semana.')
question('select_one frecuencia', 'descanso', 'Descansé bien')
end()
group('matriz_legacy', 'Matriz compatible con archivos anteriores', 'table-list')
question('select_one frecuencia', 'bienestar', 'Me sentí bien')
question('select_one frecuencia', 'apoyo', 'Sentí apoyo')
end()
group('escalas', 'Deslizadores y escalas VAS', page_break_before=True)
question('integer', 'intensidad', 'Deslizador entero de 0 a 10', appearance='slider', range_min=0, range_max=10, range_step=1,
         range_min_label='Nada', range_max_label='Máxima intensidad', range_value_position='above')
question('decimal', 'pasos_decimales', 'Deslizador de 0 a 1 en pasos de 0,1', appearance='slider', range_min=0, range_max=1,
         range_step=0.1, range_labels_position='above', range_value_position='below', range_gradient='ascending')
question('decimal', 'vas_continua', 'VAS continua con etiquetas en extremos', appearance='vas', range_min=0, range_max=100,
         range_step='any', range_min_label='Nada', range_max_label='Máximo', required=True,
         hint='Se guarda un número solo cuando interactuás con la escala. Sin interacción sigue sin responder.')
question('decimal', 'vas_completa', 'VAS con etiquetas intermedias, posiciones y estilo personalizados', appearance='vas',
         range_min=0, range_max=100, range_label_list='etiquetas_vas', range_labels_position='above', range_value_position='below',
         range_label_size=12, range_value_size=22, range_labels_boxed=False, range_labels_bold=True, range_gradient='custom',
         range_color_start='#800000', range_color_end='#008080')
question('decimal', 'vas_sin_valor', 'VAS sin mostrar el número seleccionado', appearance='vas', range_min=0, range_max=100,
         range_min_label='Muy desagradable', range_max_label='Muy agradable', range_value_position='hidden', range_gradient='descending')
end()

choices = [['list_name', 'name', 'label', 'media::image', 'label_position', 'label_align']]
for list_name, options in {
    'si_no': [('si', 'Sí'), ('no', 'No')],
    'sintomas': [('cansancio', 'Cansancio'), ('dolor', 'Dolor'), ('estres', 'Estrés')],
    'satisfaccion': [('1', 'Muy insatisfecho'), ('2', 'Insatisfecho'), ('3', 'Neutral'), ('4', 'Satisfecho'), ('5', 'Muy satisfecho')],
    'frecuencia': [('0', 'Nunca'), ('1', 'A veces'), ('2', 'Frecuentemente'), ('3', 'Siempre')],
}.items():
    choices += [[list_name, code, label, '', '', ''] for code, label in options]
choices += [['imagenes', 'ejemplo', 'Imagen de ejemplo', 'assets/templates/psira-example.svg', '', ''],
            ['imagenes', 'otra', 'Otra opción', '', '', '']]
for value, text, position in [(0, 'Nada', 'above'), (25, 'Leve', 'above'), (50, 'Moderado', 'above'), (75, 'Alto', 'above'), (100, 'Máximo', 'above')]:
    align = 'center'
    choices.append(['etiquetas_vas', str(value), text, '', position, align])

guide = [['Tema', 'Instrucción'],
 ['Qué contiene', 'survey, choices y settings forman un cuestionario real y se pueden subir juntos con las demás hojas de documentación.'],
 ['Cómo empezar', 'Guardá una copia, cambiá form_id y form_title en settings y editá las filas de survey. No cambies los encabezados técnicos.'],
 ['Compatibilidad', 'Los archivos anteriores siguen funcionando. Las nuevas columnas son opcionales. Esto es el formato de PSIRA, no todo el estándar XLSForm.'],
 ['Estructura', 'Cada pregunta debe estar dentro de begin_group y end_group. No anides grupos. Los nombres de preguntas deben ser únicos.'],
 ['Páginas', 'En survey usá page_break_before=TRUE en begin_group para iniciar otra página. Se combina con las páginas, grupos, aleatorización y encabezados/pies del paquete. No divide matrices ni genera páginas vacías.'],
 ['Valores', 'name identifica una pregunta; choices.name identifica una respuesta. No cambies códigos en instrumentos en uso: pueden afectar scripts y comparaciones históricas.'],
 ['Selección y escalas', 'Likert conserva los códigos de choices. VAS/slider guardan numberValue como número. Un control sin tocar no cuenta como respuesta.'],
 ['Valor visible', 'El número se muestra con hasta tres decimales; el valor guardado conserva su precisión. Tocá o mové la escala, o confirmá con Enter.'],
 ['Continuidad', 'VAS usa type=decimal y range_step=any. Es continua dentro de la precisión numérica y resolución del dispositivo; no es precisión matemática infinita.'],
 ['Traducciones', 'Prepará un cuestionario por idioma y elegí ese idioma en PSIRA. Las columnas label::es/label::en no se interpretan como un formulario multilingüe.'],
 ['Versiones', 'Actualizar el archivo desde PSIRA usa su sistema de versiones. settings.version no reemplaza ese sistema.'],
 ['Previsualizar', 'Subí esta guía como cuestionario de prueba antes de adaptar un instrumento real. No cambies el contenido ni la puntuación de instrumentos validados por una mejora estética.'],
 ['Ejemplo explicado', 'EJEMPLO_PASO_A_PASO explica cómo programar cada componente. El archivo PSIRA-cuestionario-ejemplo-completo.xlsx está listo para subir y contiene PRUEBAS con los resultados esperados.'],
 ['Guía de columnas', 'Consultá DICCIONARIO para todas las columnas y COMPATIBILIDAD para distinguir soporte real, metadatos y funciones no implementadas.']]

descriptions = {
 'type': ('Obligatorio', 'Tipo de pregunta o delimitador. Para selección: select_one LISTA o select_multiple LISTA.', 'select_one frecuencia'),
 'name': ('Obligatorio salvo end_group', 'Identificador único estable, sin espacios. También identifica grupos.', 'energia'),
 'label': ('Obligatorio salvo end_group', 'Texto de pregunta, nota o grupo. Texto plano; el texto enriquecido de páginas se configura en Paquetes.', '¿Cómo te sentís?'),
 'hint': ('Opcional', 'Instrucción visible debajo del enunciado.', 'Pensá en la última semana.'),
 'required': ('Opcional', 'true/false o yes/no. Si no se indica, la pregunta es opcional.', 'true'),
 'required_message': ('Opcional', 'Mensaje de obligatoriedad. Mantiene la validación actual.', 'Respondé antes de continuar.'),
 'appearance': ('Opcional', 'Vacío, cards, likert, slider o vas en preguntas. table-list o likert-matrix en begin_group.', 'vas'),
 'page_break_before': ('Solo begin_group', 'true inicia una página antes del grupo; false continúa en la página actual. Se combina con las páginas del paquete, sin dividir matrices. No genera páginas vacías.', 'true'),
 'min_length': ('Condicional', 'En select_multiple: mínimo de opciones. No se usa como límite mínimo de VAS ni como mínimo numérico general.', '1'),
 'max_length': ('Condicional', 'Máximo de caracteres en text, de selecciones en select_multiple o máximo numérico heredado. Para VAS usá range_max.', '250'),
 'relevant': ('Opcional', 'Visibilidad condicional con la sintaxis limitada de PSIRA. Ver CONDICIONES.', "${actividad} = 'si'"),
 'image': ('Opcional', 'URL de imagen en la pregunta. Debe ser accesible desde el navegador; no es una imagen incrustada en una celda.', 'assets/templates/psira-example.svg'),
 'range_min': ('slider/vas', 'Mínimo inclusivo. Por defecto 0.', '0'),
 'range_max': ('slider/vas', 'Máximo inclusivo, mayor que el mínimo. Por defecto 100.', '100'),
 'range_step': ('slider/vas', 'Incremento. Slider entero: 1; decimal: 0.1. VAS vacío/any: continuo. Integer exige límites y pasos enteros. El paso debe dividir exactamente el intervalo.', 'any'),
 'range_label_list': ('slider/vas', 'Lista de choices para etiquetas intermedias. choices.name debe ser numérico y estar dentro del rango. Sustituye las etiquetas de extremos.', 'etiquetas_vas'),
 'range_min_label': ('slider/vas', 'Texto del extremo mínimo si no se usa range_label_list. Por defecto el número mínimo.', 'Nada'),
 'range_max_label': ('slider/vas', 'Texto del extremo máximo si no se usa range_label_list. Por defecto el número máximo.', 'Máximo'),
 'range_labels_position': ('slider/vas', 'Posición general above/below; por defecto above. Cada fila de choices puede sobrescribirla.', 'below'),
 'range_value_position': ('slider/vas', 'Mostrar número arriba (above), abajo (below) u ocultarlo (hidden). Por defecto above.', 'hidden'),
 'range_label_size': ('slider/vas', 'Tamaño de etiquetas de 10 a 28 píxeles. Por defecto 14.', '12'),
 'range_value_size': ('slider/vas', 'Tamaño del valor de 10 a 28 píxeles. Por defecto 18.', '22'),
 'range_labels_boxed': ('slider/vas', 'true/false: etiquetas con recuadro. Por defecto false.', 'true'),
 'range_labels_bold': ('slider/vas', 'true/false: etiquetas en negrita. Por defecto false.', 'true'),
 'range_gradient': ('slider/vas', 'none, ascending, descending o custom. Por defecto none. No modifica el valor guardado.', 'custom'),
 'range_color_start': ('slider/vas', 'Color inicial #RRGGBB. Por defecto #800000.', '#800000'),
 'range_color_end': ('slider/vas', 'Color final #RRGGBB. Por defecto #008080.', '#008080'),
 'constraint': ('Sin ejecución general', 'Se importa como metadato; PSIRA no ejecuta expresiones XLSForm arbitrarias. No lo uses como validación garantizada.', ''),
 'constraint_message': ('Opcional', 'Texto asociado a errores. No activa por sí mismo una expresión constraint.', ''),
 'calculation': ('Sin ejecución general', 'Se conserva como metadato; no activa fórmulas XLSForm. La puntuación por scripts se configura por separado en PSIRA.', ''),
 'default': ('Sin aplicación automática', 'Se importa como metadato; no configura una respuesta inicial garantizada. VAS no registra un valor inicial.', ''),
 'choice_filter': ('Sin ejecución general', 'El filtrado dinámico de listas por expresiones XLSForm no está implementado.', ''),
}
dictionary = [['Hoja', 'Columna', 'Aplicación', 'Descripción', 'Ejemplo']]
for key in COLUMNS:
    dictionary.append(['survey', key, *descriptions[key]])
for key, description in [('list_name','Nombre de la lista referenciada desde survey.'), ('name','Código de respuesta. Para etiquetas VAS, posición numérica en el rango.'),
                         ('label','Texto visible de la opción o etiqueta.'), ('media::image','URL de imagen de una opción de selección.'),
                         ('label_position','Solo etiquetas VAS: above/below. Si está vacío usa range_labels_position.'),
                         ('label_align','Solo etiquetas VAS: auto/left/center/right. El centro de cada etiqueta coincide con su valor, incluidos los extremos; align cambia solo la alineación del texto.')]:
    dictionary.append(['choices', key, 'Tres primeras obligatorias', description, ''])
for key, description in [('form_title','Nombre sugerido; el nombre introducido en PSIRA tiene prioridad.'), ('form_id','Identificador/abreviatura; elegí uno nuevo para crear otro cuestionario.'),
                         ('version','Metadato heredado; PSIRA gestiona las versiones de archivo.'), ('language','Metadato; el idioma se elige al cargar en PSIRA.'),
                         ('questionnaire_type','Metadato reconocido por el lector, sin efecto en esta importación.'), ('submission_url','No cambia el destino de envío; las respuestas se guardan en PSIRA.')]:
    dictionary.append(['settings', key, 'form_title/form_id recomendados', description, ''])
types = [['Tipo', 'Uso', 'Respuesta guardada'], ['text','Texto libre; textarea','textValue'], ['integer','Número entero','numberValue'],
 ['decimal','Número decimal','numberValue'], ['checkbox','Una casilla verdadero/falso','booleanValue'], ['date','Fecha','dateValue'],
 ['time','Hora','textValue'], ['date_time','Fecha y hora','dateValue y textValue'], ['select_one LISTA','Una opción de choices','textValue = choices.name'],
 ['select_multiple LISTA','Varias opciones de choices','multipleChoiceValue = códigos'], ['note','Texto informativo, sin respuesta','Ninguna'],
 ['begin_group / end_group','Agrupación obligatoria del archivo; no anidar','No es una respuesta']]
appearances = [['Dónde', 'appearance', 'Configuración'], ['Pregunta','vacío','Presentación habitual mejorada; compatible con archivos anteriores.'],
 ['select_one/select_multiple','cards','Tarjetas seleccionables; no modifica los códigos.'], ['select_one','likert','Escala individual; usa las opciones de choices.'],
 ['begin_group','likert-matrix','Matriz de preguntas select_one. Usá la misma lista para mantener columnas iguales.'],
 ['begin_group','table-list','Matriz heredada compatible.'], ['integer/decimal','slider','Deslizador por pasos, con etiquetas configurables.'],
 ['decimal','vas','Escala continua; step any por defecto. También permite un paso explícito si el protocolo lo requiere.']]
compat = [['Función', 'Estado'], ['Texto, números, fechas, hora, selección, notas','Disponibles; ver TIPOS.'],
 ['Matrices y apariencias de este ejemplo','Disponibles con esta actualización.'], ['Imágenes','URLs en image/media::image; no imágenes pegadas dentro del Excel.'],
 ['relevant','Soporte limitado a las condiciones documentadas; no todo XPath/XLSForm.'], ['constraint/calculation/default/choice_filter','Metadatos o funciones sin ejecución general; no asumir el comportamiento de ODK.'],
 ['min_length en texto / mínimo numérico heredado','No se valida como límite general. En escalas nuevas usar range_min; para selección múltiple sí limita cantidad.'],
 ['label::IDIOMA y formularios multilingües XLSForm','No implementado; usar una versión por idioma y elegirlo en la carga.'],
 ['visual_analog_scales (tipo antiguo)','No es la nueva VAS numérica. Usá decimal + appearance=vas.'],
 ['Grupos anidados / preguntas fuera de grupos','No admitidos por el formato de importación actual.'],
 ['Páginas y cabeceras/pies ricos','Los paquetes definen sus páginas y textos ricos. page_break_before agrega páginas internas al cuestionario y conserva las páginas del paquete.'],
 ['Cambios de códigos y escalas de instrumentos validados','Requieren revisar sus scripts y su metodología. La apariencia no cambia la puntuación por sí sola.']]
conditions = [['Expresión de relevant', 'Uso'], ["${actividad} = 'si'", 'Mostrar si una respuesta única tiene el código si.'],
 ['${dias} > 3', 'Comparación numérica mayor que.'], ['${dias} < 4', 'Comparación numérica menor que.'],
 ["selected(${sintomas}, 'dolor')", 'Mostrar si una lista múltiple incluye el código dolor.'],
 ['and / or', 'Combinaciones simples: la implementación actual evalúa de izquierda a derecha; no asumir precedencia ni paréntesis anidados.'],
 ['Advertencia', 'Usá nombres de preguntas estables. Probá cada rama en PSIRA antes de publicar.']]
example_steps = [
 ['Paso', 'Qué programar', 'Hoja y ejemplo', 'Qué comprobar en PSIRA'],
 [1, 'Definir el formulario', 'settings: form_title=Mi cuestionario; form_id=mi_cuestionario; language=es.', 'El nombre y el idioma se seleccionan al cargar el cuestionario.'],
 [2, 'Abrir un grupo', 'survey: type=begin_group; name=mi_grupo; label=Preguntas iniciales; page_break_before=TRUE para empezar otra página.', 'Todas las preguntas pertenecen a un grupo, sin anidar grupos.'],
 [3, 'Pregunta obligatoria', 'survey: type=text; name=comentario; label=¿Cómo te sentís?; required=TRUE; required_message=Completá la respuesta.', 'Intentá continuar sin responder: debe bloquear el avance.'],
 [4, 'Definir opciones', 'choices: list_name=si_no; name=si; label=Sí. Otra fila: list_name=si_no; name=no; label=No.', 'name es el código guardado; label es lo que se muestra.'],
 [5, 'Usar las opciones', 'survey: type=select_one si_no; name=actividad; label=¿Hiciste actividad?; appearance=cards.', 'Aparecen dos tarjetas, con selección única.'],
 [6, 'Mostrar por condición', "survey: type=text; name=detalle_actividad; label=¿Cuál?; relevant=${actividad} = 'si'.", 'Elegí Sí y luego No: el detalle debe mostrarse y ocultarse.'],
 [7, 'Programar una matriz', 'Cerrá el grupo con end_group. Abrí begin_group con appearance=likert-matrix. Agregá preguntas select_one frecuencia.', 'Las preguntas que comparten la misma lista aparecen como filas de una matriz.'],
 [8, 'Programar una VAS', 'En un grupo habitual: type=decimal; name=vas; label=Intensidad; appearance=vas; range_min=0; range_max=100; range_step=any.', 'Sin tocarla está sin responder; al moverla guarda un número, incluido cero.'],
 [9, 'Etiquetas intermedias', 'range_label_list=etiquetas_vas. En choices usar name=0,25,50,75,100; label_position=above/below; label_align=left/center/right.', 'Cada etiqueta conserva su posición y alineación. Mirá vas_completa en survey.'],
 [10, 'Estilo de la escala', 'range_labels_boxed=TRUE; range_labels_bold=TRUE; range_gradient=custom; range_color_start=#800000; range_color_end=#008080.', 'Recuadros, negrita y gradiente. Consultá DICCIONARIO antes de cambiar valores.'],
 [11, 'Cerrar y probar', 'Última fila del grupo: type=end_group. Guardá como .xlsx y subilo desde Cuestionarios.', 'survey/choices/settings contienen un ejemplo completo listo para cargar. Las hojas explicativas no se ejecutan.'],
 [12, 'Otro idioma', 'Duplicá el archivo y traducí label, hint, required_message y los textos de choices; conservá los códigos name.', 'Seleccioná el idioma correspondiente en PSIRA. Esta guía está escrita en español.'],
]
checks = [['Pregunta o bloque', 'Prueba', 'Resultado esperado']]
for data in rows:
    item = dict(zip(COLUMNS, data))
    if item['type'] in ('begin_group', 'end_group'):
        continue
    instruction = 'Responder y volver a abrir la evaluación.'
    expected = 'La respuesta se conserva y mantiene su tipo.'
    if item['type'] == 'note':
        instruction = 'Leer la nota.'
        expected = 'Se muestra contenido informativo, sin campo de respuesta.'
    if item['appearance'] == 'vas':
        instruction = 'Abrir sin tocar, luego elegir cero, un punto intermedio y el máximo.'
        expected = 'Sin interacción no hay respuesta; los tres valores se guardan. Revisar etiquetas y estilo indicados en survey.'
    elif item['appearance'] == 'slider':
        instruction = 'Mover con mouse, táctil o flechas del teclado.'
        expected = 'Respeta range_min, range_max y range_step; no guarda una respuesta al abrir.'
    elif item['type'].startswith('select_'):
        expected = 'Las opciones y la apariencia coinciden con choices y appearance; se conservan sus códigos.'
    if item['relevant']:
        instruction = 'Cambiar la respuesta de la pregunta referenciada en relevant.'
        expected = 'Se muestra solo si se cumple: ' + item['relevant']
    if item['required']:
        instruction += ' Intentar avanzar sin responder.'
        expected += ' Sin respuesta no permite continuar.'
    checks.append([item['name'], instruction, expected])

sheets = [('LEEME',guide,[24,110]), ('EJEMPLO_PASO_A_PASO',example_steps,[12,30,100,85]), ('survey',[COLUMNS]+rows,[24,26,64,66]+[23]*(len(COLUMNS)-4)), ('choices',choices,[26,20,42,48,24,24]),
 ('settings',[['form_title','form_id','version','language','questionnaire_type','submission_url'],['Guía completa de cuestionarios PSIRA','psira_guia_v1','1','es','Other','']],[60,30,14,14,28,40]),
 ('DICCIONARIO',dictionary,[18,30,30,110,55]), ('TIPOS',types,[28,95,45]), ('APARIENCIAS',appearances,[30,24,110]), ('CONDICIONES',conditions,[48,110]), ('COMPATIBILIDAD',compat,[50,110])]

def column(index):
    result=''
    while index:
        index, r = divmod(index-1,26)
        result=chr(65+r)+result
    return result

def worksheet(data,widths):
    out=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
         '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
         '<cols>'+''.join(f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>' for i,w in enumerate(widths,1))+'</cols><sheetData>']
    for r,row in enumerate(data,1):
        out.append(f'<row r="{r}" ht="{36 if r==1 else 64}" customHeight="1">')
        for c,value in enumerate(row,1):
            if value=='': continue
            style=1 if r==1 else (3 if value in ['begin_group','end_group'] else 2)
            attrs=f'r="{column(c)}{r}" s="{style}"'
            if isinstance(value,bool): out.append(f'<c {attrs} t="b"><v>{int(value)}</v></c>')
            elif isinstance(value,(int,float)): out.append(f'<c {attrs}><v>{value}</v></c>')
            else: out.append(f'<c {attrs} t="inlineStr"><is><t xml:space="preserve">{escape(str(value))}</t></is></c>')
        out.append('</row>')
    out.append(f'</sheetData><autoFilter ref="A1:{column(len(widths))}{len(data)}"/></worksheet>')
    return ''.join(out)
styles='''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF315B8E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF2FC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf xfId="0"/><xf fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf fontId="0" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'''
def write_workbook(output, sheets):
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,'w',ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1,len(sheets)+1))+'</Types>')
        z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml','<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+''.join(f'<sheet name="{name}" sheetId="{i}" r:id="rId{i}"/>' for i,(name,_,_) in enumerate(sheets,1))+'</sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,len(sheets)+1))+f'<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr('xl/styles.xml',styles)
        for i,(_,data,widths) in enumerate(sheets,1): z.writestr(f'xl/worksheets/sheet{i}.xml',worksheet(data,widths))

write_workbook(OUTPUT, sheets)
example_sheets = [sheet for sheet in sheets if sheet[0] in ('survey', 'choices', 'settings')]
example_sheets = [(name, [data[0], ['Prueba completa de posibilidades PSIRA', 'psira_prueba_completa', '1', 'es', 'Other', '']] if name == 'settings' else data, widths)
                  for name, data, widths in example_sheets]
example_sheets += [('PRUEBAS', checks, [30,100,110])]
write_workbook(EXAMPLE_OUTPUT, example_sheets)
print(f'Created {OUTPUT.name}: {len(sheets)} sheets, {len(rows)} survey rows')
print(f'Created {EXAMPLE_OUTPUT.name}: {len(example_sheets)} sheets, {len(checks)-1} test questions')

# Keep the original Spanish URLs working, and provide explicit language variants.
write_workbook(OUTPUT.with_name(f'{OUTPUT.stem}-es.xlsx'), sheets)
write_workbook(EXAMPLE_OUTPUT.with_name(f'{EXAMPLE_OUTPUT.stem}-es.xlsx'), example_sheets)
for lang in LANGS:
    localized = localize_sheets(sheets, lang)
    guide_path = OUTPUT.with_name(f'{OUTPUT.stem}-{lang}.xlsx')
    write_workbook(guide_path, localized)
    localized_example = [(name, [data[0], [EXAMPLE_TITLE[lang], f'psira_prueba_completa_{lang}', '1', lang, 'Other', '']]
                          if name == 'settings' else data, widths)
                         for name, data, widths in localized if name in ('survey', 'choices', 'settings')]
    localized_survey = next(data for name, data, widths in localized if name == 'survey')
    localized_example.append(('TESTS', test_checklist(localized_survey, lang), [30,100,110]))
    example_path = EXAMPLE_OUTPUT.with_name(f'{EXAMPLE_OUTPUT.stem}-{lang}.xlsx')
    write_workbook(example_path, localized_example)
    svg = (OUTPUT.parent / 'psira-example.svg').read_text()
    labels = {'en': 'Example image', 'de': 'Beispielbild', 'nl': 'Voorbeeldafbeelding'}
    svg = svg.replace('Ejemplo de imagen para un cuestionario PSIRA', labels[lang] + ' · PSIRA')
    svg = svg.replace('Imagen de ejemplo', labels[lang])
    (OUTPUT.parent / f'psira-example-{lang}.svg').write_text(svg)
    print(f'Created {guide_path.name} and {example_path.name}')
