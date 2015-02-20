#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys
import argparse
import json

from extractors.hb import extract_hb
from babel.messages.extract import _strip_comment_tags

def strip_comment_tags(comments, comment_tags):
    _strip_comment_tags(comments, comment_tags)
    return comments


parser = argparse.ArgumentParser(description='Run extract_hb for you')

parser.add_argument('files', metavar='FILEPATH', type=unicode, nargs='+')
parser.add_argument('-k', '--keyword', dest='keywords', action='append')
parser.add_argument('-c', '--comment', dest='comment_tags', action='append', help="a list of translator tags to search for and include in the results")

args = parser.parse_args()

out = {}

keywords = [k.split(':')[0] for k in args.keywords]
comment_tags = args.comment_tags

for path in args.files:
    f = open(path, 'rt')
    # (lineno, funcname, funargs, [translator_comment])
    result = extract_hb(f, keywords, comment_tags, {})

    out[path] = [(funcname, funargs, strip_comment_tags(comments, comment_tags)) for lineno, funcname, funargs, comments in result]

print json.dumps(out)
