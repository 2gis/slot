# -*- coding: utf-8 -*
"""
Handlebars
"""

__docformat__ = 'restructuredtext en'

import re

HB_TAG_RE = re.compile(r'{{\s*(\w+)\s+(.*?)\s*}}', re.M | re.U | re.DOTALL)
FUN_ARGS_RE = re.compile(r"""(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^"'\s]+)+""", re.M | re.U)
HB_COMMENT_RE = re.compile(r'{{!(?:--)?\s*(.+)}}', re.U)
ESC_RE = re.compile(r'\\(.)', re.U)

def safe_strip(s, chars):
    if s[0] in chars:
        s = s[1:]
    if s[-1] in chars:
        s = s[:-1]
    return s

def extract_hb(fileobj, keywords, comment_tags, options):
    """Extract messages from Handlebars template files.
    :param fileobj: the file-like object the messages should be extracted
                    from
    :param keywords: a list of keywords (i.e. function names) that should
                     be recognized as translation functions
    :param comment_tags: a list of translator tags to search for and
                         include in the results
    :param options: a dictionary of additional options (optional)
    :return: an iterator over ``(lineno, funcname, message, comments)``
             tuples
    :rtype: ``iterator``
    """

    encoding = options.get('encoding', 'utf-8')

    template = fileobj.read().decode(encoding)
    template_tags = HB_TAG_RE.finditer(template)

    for tag_match in template_tags:
        translator_comment = ''
        start_pos = tag_match.start()
        funcname, funargs = tag_match.groups()

        if funcname not in keywords:
            continue

        funargs = map(lambda x: x.strip(), FUN_ARGS_RE.findall(funargs))

        messages = [safe_strip(ESC_RE.sub(r'\1', m), '\'"') for m in funargs if m[0] in ('"', "'")]

        lineno = template[:start_pos].count('\n') + 1

        comment_line = template.split('\n')[lineno - 2]
        comment_match = HB_COMMENT_RE.search(comment_line)

        if comment_match:
            comment = comment_match.group(1).rstrip('-')
            for comment_tag in comment_tags:
                if comment.startswith(comment_tag):
                    translator_comment = comment

        yield (lineno, funcname, messages, [translator_comment] if translator_comment else [])
