# Fucina

Fucina means forge or smithy in Italian and is pronounced "foo-chee-na".

## What?

Fucina is a two-way data binding library for forms. It is intentionally limited in its abilities and small. It only does data-binding, conditional showing-and-hiding of fields, and some very limited validation (it mostly relies on the browser and/or you to do that.)

It does intentionally omits features like changing the form, complex internal validation, and extremely complex form structures (it does allow for some nesting.) This is on purpose because this library is intended to scratch one-and-only-one itch: simple two-way data-binding forms.

## Why?

The desire for this library arose when I was creating an embed that I did not want to include AngularJS or ReactJS for really only the data-binding purpose. As such, I wrote this tiny, dependency-free form (though currenly it includes a few methods from Underscore.

## API

Forthcoming documentation. The code is in a pretty messy state so I'm going to restructure a lot. This is running in productin as-is on redditgifts.com but it only has the features built out that one app needed and thus lacks certain essential features like radio buttons. This was mostly built for my own use.

## Future Development

- Fill out feature set like radio buttons
- Tests
- Organize code
- Universal packaging (right now only works with CommonJS)
- Server-side pre-render (might as well; it show work right now as-is)
- Perhaps better bootstrapping. It's kinda awkward as is. Maybe JSX? Who knows.
- Real documentation.
- Some benchmarks could be fun.

## License

MIT. Do whatever the hell you want with it.